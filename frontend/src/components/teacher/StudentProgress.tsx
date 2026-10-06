import Card from '../ui/Card'
import TaskStatusBadge from '../tasks/TaskStatusBadge'
import { describeEvent } from '../../lib/evidence'
import { formatEventTime } from '../../lib/format'
import { sortByFocus } from '../../lib/tasks'
import { academicLabel, countStatuses, latestEventByTask } from '../../lib/teacher'
import type { EvidenceEvent, Task } from '../../types/domain'

/** The student's academic work and the latest recorded action on each task. */
export default function StudentProgress({ tasks, events }: { tasks: Task[]; events: EvidenceEvent[] }) {
  const latest = latestEventByTask(events)
  const ordered = sortByFocus(tasks)

  return (
    <Card className="progress">
      <h2 className="section-title">Academic progress</h2>
      <p className="note">{academicLabel(countStatuses(tasks))}</p>
      {ordered.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <ul className="progress__list">
          {ordered.map((t) => {
            const last = latest[t.id]
            return (
              <li key={t.id} className="progress__item">
                <div className="progress__head">
                  <strong>{t.title}</strong>
                  <TaskStatusBadge status={t.status} />
                </div>
                <p className="progress__meta">{t.subject}</p>
                <p className="progress__meta">
                  {last ? (
                    <>
                      Latest action: {describeEvent(last)} · <time dateTime={last.occurredAt}>{formatEventTime(last.occurredAt)}</time>
                    </>
                  ) : (
                    'No actions recorded yet'
                  )}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
