import { useId, useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TaskStatusBadge from './TaskStatusBadge'
import { DIMENSION_LABELS } from '../../content/labels'
import { formatMinutes } from '../../lib/format'
import type { Task } from '../../types/domain'

type Props = {
  task: Task
  /** Where "Open Task" goes. Supplied by the page so the card stays routing-agnostic. */
  to: string
  /** Marks the task the service recommends focusing on now. */
  isCurrentFocus?: boolean
}

export default function TaskCard({ task, to, isCurrentFocus }: Props) {
  const [showWhy, setShowWhy] = useState(false)
  const whyId = useId()
  const finished = task.status === 'completed' || task.status === 'submitted'

  return (
    <Card lift className="task-item">
      <div className="task-item__top">
        <Badge tone="blue">{task.subject}</Badge>
        <TaskStatusBadge status={task.status} />
        {isCurrentFocus && <Badge tone="orange">Today&apos;s focus</Badge>}
      </div>

      <h2 className="task-item__title">{task.title}</h2>
      <p>{task.description}</p>
      {task.estimatedMinutes !== undefined && (
        <p className="task-item__effort">
          <span>Estimated effort</span> {formatMinutes(task.estimatedMinutes)}
        </p>
      )}

      {task.opportunities.length > 0 && (
        <div className="task-item__dev">
          <p className="task-item__dev-label">Develops through this task</p>
          <ul className="chips chips--solid">
            {task.opportunities.map((o) => (
              <li key={o.dimension}>{DIMENSION_LABELS[o.dimension]}</li>
            ))}
          </ul>
          <button
            type="button"
            className="why"
            aria-expanded={showWhy}
            aria-controls={whyId}
            onClick={() => setShowWhy((v) => !v)}
          >
            Why? {showWhy ? '−' : '+'}
          </button>
          {showWhy && (
            <dl id={whyId} className="task-item__why">
              {task.opportunities.map((o) => (
                <div key={o.dimension}>
                  <dt>{DIMENSION_LABELS[o.dimension]}</dt>
                  <dd>{o.reason}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <div className="task-item__action">
        <Button to={to} variant={finished ? 'light' : 'action'} arrow>Open Task</Button>
      </div>
    </Card>
  )
}
