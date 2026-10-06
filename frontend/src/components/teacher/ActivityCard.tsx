import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TaskStatusBadge from '../tasks/TaskStatusBadge'
import { DIMENSION_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import { formatMinutes } from '../../lib/format'
import { countStatuses } from '../../lib/teacher'
import type { Activity, Task } from '../../types/domain'

type Props = {
  activity: Activity
  /** Each participating student's task for this activity. */
  tasks: Task[]
  studentNames: Record<string, string>
}

export default function ActivityCard({ activity, tasks, studentNames }: Props) {
  const [open, setOpen] = useState(false)
  const detailId = useId()
  const counts = countStatuses(tasks)

  return (
    <Card lift className="activity">
      <div className="activity__top">
        <Badge tone="blue">{activity.subject}</Badge>
        <span className="activity__effort">{formatMinutes(activity.estimatedMinutes)}</span>
      </div>
      <h2 className="task-item__title">{activity.title}</h2>
      {activity.description && <p>{activity.description}</p>}

      <div>
        <p className="task-item__dev-label">Development opportunities</p>
        <ul className="chips chips--solid">
          {activity.opportunities.map((o) => (
            <li key={o.dimension}>{DIMENSION_LABELS[o.dimension]}</li>
          ))}
        </ul>
      </div>

      <p className="activity__participation">
        {tasks.length === 0
          ? 'Not assigned to any students yet.'
          : `${tasks.length} ${tasks.length === 1 ? 'student' : 'students'} · ${counts.notStarted} not started · ${counts.inProgress} in progress · ${counts.completed} completed`}
      </p>

      <div className="activity__action">
        <Button variant="light" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={detailId}>
          {open ? 'Hide Activity' : 'View Activity'}
        </Button>
      </div>

      {open && (
        <div id={detailId} className="activity__detail">
          <h3>How this work creates opportunities</h3>
          <dl className="task-item__why">
            {activity.opportunities.map((o) => (
              <div key={o.dimension}>
                <dt>{DIMENSION_LABELS[o.dimension]}</dt>
                <dd>{o.reason}</dd>
              </div>
            ))}
          </dl>
          <h3>Students</h3>
          {tasks.length === 0 ? (
            <p className="note">Nobody has this activity yet.</p>
          ) : (
            <ul className="link-list">
              {tasks.map((t) => (
                <li key={t.id}>
                  <Link to={teacherRoutes.student(t.studentId)}>{studentNames[t.studentId] ?? 'Student'}</Link>
                  <TaskStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to={teacherRoutes.evidence({ activity: activity.id })} className="text-link">
            See evidence for this activity
          </Link>
        </div>
      )}
    </Card>
  )
}
