import type { ReactNode } from 'react'
import Card from '../ui/Card'
import type { AsyncState } from '../../hooks/useAsyncData'

type Props<T> = {
  state: AsyncState<T>
  loadingLabel?: string
  children: (data: T) => ReactNode
}

/** Standard loading / error handling so pages only describe the ready state. */
export default function AsyncView<T>({ state, loadingLabel = 'Loading…', children }: Props<T>) {
  if (state.status === 'loading') return <p role="status" className="note">{loadingLabel}</p>
  if (state.status === 'error') {
    return <Card tone="softOrange" role="alert">Something went wrong while loading this page. Please try again.</Card>
  }
  return <>{children(state.data)}</>
}
