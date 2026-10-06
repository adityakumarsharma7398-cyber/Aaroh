// Plain-language wording for failed requests. Keyed off the normalised ApiError kind, never the backend's own text.
import { ApiError } from '../services/apiClient'

export interface ErrorCopy {
  title: string
  message: string
}

export function describeError(error: unknown): ErrorCopy {
  switch (error instanceof ApiError ? error.kind : undefined) {
    case 'unauthorized':
      return { title: "You're not signed in", message: 'Your session is missing or no longer valid. Sign in again to continue.' }
    case 'forbidden':
      return { title: "This account can't open that", message: "You don't have access to this with the account you're using." }
    case 'network':
      return { title: "Can't reach AAROH", message: 'The server did not respond. Check that the backend is running, then reload the page.' }
    case 'not-found':
      return { title: "We couldn't find that", message: 'It may have been removed, or the link may be wrong.' }
    case 'server':
      return { title: 'Something went wrong on our side', message: 'Please try again in a moment.' }
    default:
      return { title: 'Something went wrong', message: 'We could not load this page. Please try again.' }
  }
}

/** One line for a failed action (saving, requesting a hint...). Sign-in and connection problems get their own wording. */
export function actionMessage(error: unknown, fallback: string): string {
  const kind = error instanceof ApiError ? error.kind : undefined
  if (kind === 'unauthorized') return "You're not signed in, so that could not be saved."
  if (kind === 'forbidden') return "This account isn't allowed to do that."
  if (kind === 'network') return "Can't reach the server. Check your connection and try again."
  return fallback
}
