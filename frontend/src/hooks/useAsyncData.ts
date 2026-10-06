import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; data: T }
export type AsyncResult<T> = AsyncState<T> & { reload: () => void }

/**
 * Runs a loader and tracks loading / error / ready.
 *  - `key` identifies what is being loaded (e.g. a route id). A new key shows the loading state and refetches.
 *  - `reload()` refetches silently, keeping the current data on screen. Use it after a mutation.
 */
export function useAsyncData<T>(load: () => Promise<T>, key = ''): AsyncResult<T> {
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [tick, setTick] = useState(0)
  const loadedKey = useRef(key)

  useEffect(() => {
    let cancelled = false
    if (loadedKey.current !== key) {
      loadedKey.current = key
      setState({ status: 'loading' })
    }
    loadRef.current()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', error })
      })
    return () => {
      cancelled = true
    }
  }, [key, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return useMemo(() => ({ ...state, reload }), [state, reload])
}
