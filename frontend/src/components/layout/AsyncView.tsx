import type { ReactNode } from 'react'
import ErrorNotice from './ErrorNotice'
import type { AsyncState } from '../../hooks/useAsyncData'

type Props<T> = {
  state: AsyncState<T>
  loadingLabel?: string
  children: (data: T) => ReactNode
}

/** Standard loading / error handling so pages only describe the ready state. */
export default function AsyncView<T>({ state, loadingLabel = 'Loading…', children }: Props<T>) {
  if (state.status === 'loading') return <p role="status" className="note">{loadingLabel}</p>
  if (state.status === 'error') return <ErrorNotice error={state.error} />
  return <>{children(state.data)}</>
}
