import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { DIMENSION_LABELS } from '../../content/labels'
import { formatEventTime } from '../../lib/format'
import type { TeacherObservation } from '../../types/domain'

type Props = {
  observations: TeacherObservation[]
  taskTitles: Record<string, string>
}

/** Notes recorded by the teacher. They are context, and are not turned into a score. */
export default function ObservationList({ observations, taskTitles }: Props) {
  return (
    <Card className="obs">
      <h2 className="section-title">Teacher observations</h2>
      {observations.length === 0 ? (
        <p className="note">No observations recorded yet. Use the quick log to add one.</p>
      ) : (
        <ul className="obs__list">
          {observations.map((o) => (
            <li key={o.id} className="obs__item">
              <p className="obs__text">{o.text}</p>
              <p className="obs__meta">
                {o.dimension && <Badge tone="pink">{DIMENSION_LABELS[o.dimension]}</Badge>}
                {o.taskId && taskTitles[o.taskId] && <span>{taskTitles[o.taskId]} · </span>}
                <time dateTime={o.createdAt}>{formatEventTime(o.createdAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
