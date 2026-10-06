import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { TASK_STATUS_LABELS } from '../../content/labels'
import { formatMinutes } from '../../lib/format'
import type { Task } from '../../types/domain'

type Props = {
  task: Task
  /** Where "Open Task" goes. Supplied by the page so this card stays routing-agnostic. */
  to: string
  eyebrow?: string
}

export default function TaskSummaryCard({ task, to, eyebrow = "Today's focus" }: Props) {
  return (
    <Card big className="task-card">
      <div className="task-card__band">
        <span>{eyebrow}</span>
        <Badge tone="white">{task.subject}</Badge>
      </div>
      <div className="task-card__body">
        <h2 className="task-card__title">{task.title}</h2>
        <p>{task.description}</p>
        <dl className="task-card__meta">
          <div>
            <dt>Status</dt>
            <dd><Badge tone="yellow">{TASK_STATUS_LABELS[task.status]}</Badge></dd>
          </div>
          <div>
            <dt>Estimated effort</dt>
            <dd>{formatMinutes(task.estimatedMinutes)}</dd>
          </div>
        </dl>
        <Button to={to} variant="action" size="lg" arrow>Open Task</Button>
      </div>
    </Card>
  )
}
