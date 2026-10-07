// HTTP client for the service layer. Pages and components never call fetch() or know URLs or auth:
// services own the integration and call this.
//
// Backend contract (server/API.md):
//  - success: { "data": ... }            -> this client returns the unwrapped `data`
//  - error:   { "error": { code, message } } -> normalised to ApiError. The backend's message is NEVER surfaced
//    to users; the UI uses its own wording keyed off `kind`.
//
// Configuration (frontend/.env.example, names only):
//  - VITE_API_BASE_URL    where the API lives, e.g. http://localhost:3001/api (defaults to same-origin /api)
//  - VITE_DEV_AUTH_TOKEN  DEVELOPMENT ONLY identity sent as `Authorization: Bearer <token>`. The backend resolves it
//    against its profiles table. Replace with real session auth; this is set in ONE place (here), never in services.
//
// Identical concurrent GETs share one in-flight request, so two service methods that read the same resource
// (or React StrictMode's double effect) do not hit the network twice. POSTs are never shared.

export type ApiErrorKind =
  | 'network'
  | 'invalid-request'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'too-large'
  | 'server'
  | 'unexpected-response'

export class ApiError extends Error {
  /** HTTP status, or 0 when no response was received or understood. */
  readonly status: number
  readonly kind: ApiErrorKind
  /** The backend's machine-readable error code (e.g. TASK_NOT_FOUND), when it sent one. For logic, not display. */
  readonly code?: string

  constructor(kind: ApiErrorKind, status = 0, code?: string) {
    super(kind)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'invalid-request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 413) return 'too-large'
  if (status >= 500) return 'server'
  return 'unexpected-response'
}

export interface ApiClientConfig {
  /** Prefix for every path. Empty means same-origin relative requests. */
  baseUrl?: string
  credentials?: RequestCredentials
  /** Development identity, sent as a bearer token on every request. */
  authToken?: string
  /** Injectable for tests. */
  fetchImpl?: typeof fetch
}

export interface RequestOptions<T> {
  body?: unknown
  signal?: AbortSignal
  /** Validates and narrows the decoded (and unwrapped) JSON. Throw to reject it. */
  parse?: (data: unknown) => T
}

/** Unwraps `{ data: ... }`. Bodies without that envelope (e.g. /health) are returned as they are. */
function unwrap(json: unknown): unknown {
  if (json !== null && typeof json === 'object' && !Array.isArray(json) && 'data' in json) {
    return (json as { data: unknown }).data
  }
  return json
}

async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json()
    const code = (body as { error?: { code?: unknown } })?.error?.code
    return typeof code === 'string' ? code : undefined
  } catch {
    return undefined
  }
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = (config.baseUrl ?? '').replace(/\/+$/, '')
  const credentials = config.credentials ?? 'same-origin'
  const doFetch = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const inflight = new Map<string, Promise<unknown>>()

  async function send(method: 'GET' | 'POST', path: string, options: RequestOptions<unknown>): Promise<unknown> {
    let response: Response
    try {
      response = await doFetch(`${baseUrl}${path}`, {
        method,
        credentials,
        signal: options.signal,
        headers: {
          Accept: 'application/json',
          ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      })
    } catch {
      throw new ApiError('network')
    }

    if (!response.ok) throw new ApiError(kindForStatus(response.status), response.status, await errorCode(response))

    try {
      return unwrap(await response.json())
    } catch {
      throw new ApiError('unexpected-response', response.status)
    }
  }

  async function request<T>(method: 'GET' | 'POST', path: string, options: RequestOptions<T> = {}): Promise<T> {
    let raw: unknown
    if (method === 'GET' && !options.signal) {
      let pending = inflight.get(path)
      if (!pending) {
        pending = send(method, path, options).finally(() => inflight.delete(path))
        inflight.set(path, pending)
      }
      raw = await pending
    } else {
      raw = await send(method, path, options)
    }

    if (!options.parse) return raw as T
    try {
      return options.parse(raw)
    } catch {
      throw new ApiError('unexpected-response', 200)
    }
  }

  return {
    get: <T>(path: string, options?: Omit<RequestOptions<T>, 'body'>) => request<T>('GET', path, options),
    post: <T>(path: string, options?: RequestOptions<T>) => request<T>('POST', path, options),
  }
}

// `import.meta.env` is injected by Vite. The optional chaining keeps this module importable outside Vite (scripts).
const env = (import.meta as { env?: Record<string, string | undefined> }).env

/** Shared default client, configured from the environment. */
export const apiClient = createApiClient({
  baseUrl: env?.VITE_API_BASE_URL || 'http://localhost:3001/api',
  authToken: env?.VITE_DEV_AUTH_TOKEN || 'student-maya',
})
