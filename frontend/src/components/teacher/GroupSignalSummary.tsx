import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import { SignalBadge } from '../ui/SignalList'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import type { GroupSignal } from '../../types/domain'

/** Compact qualitative view of each dimension across the group, with a way into the evidence. */
export default function GroupSignalSummary({ signals }: { signals: GroupSignal[] }) {
  return (
    <Card className="t-dev">
      <h2 className="section-title">Development patterns</h2>
      <p className="note">Qualitative signals across the group. Each one links to the evidence behind it.</p>
      <ul className="sig-rows">
        {signals.map((s) => (
          <li key={s.dimension}>
            <div className="sig-rows__head">
              <strong>{DIMENSION_LABELS[s.dimension]}</strong>
              <SignalBadge trend={s.trend ? SIGNAL_TREND_LABELS[s.trend] : 'Not enough evidence yet'} />
            </div>
            <p>{s.summary}</p>
            <Link to={teacherRoutes.signal(s.dimension)} className="text-link">See the evidence</Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
