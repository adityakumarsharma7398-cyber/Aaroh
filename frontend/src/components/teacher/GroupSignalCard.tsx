import { Link } from 'react-router-dom'
import { SignalBadge } from '../ui/SignalList'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import type { GroupSignal } from '../../types/domain'

/** A selectable dimension on the Growth Signals page. Selecting it opens its evidence. */
export default function GroupSignalCard({ signal, selected }: { signal: GroupSignal; selected: boolean }) {
  const n = signal.studentIds.length
  return (
    <Link
      to={teacherRoutes.signal(signal.dimension)}
      className={`gcard${selected ? ' is-selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="gcard__head">
        <strong>{DIMENSION_LABELS[signal.dimension]}</strong>
        <SignalBadge trend={signal.trend ? SIGNAL_TREND_LABELS[signal.trend] : 'Not enough evidence yet'} />
      </span>
      <span className="gcard__meta">{n} {n === 1 ? 'student' : 'students'} with a signal</span>
    </Link>
  )
}
