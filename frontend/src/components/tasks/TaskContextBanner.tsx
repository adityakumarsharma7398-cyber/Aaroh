import Badge from '../ui/Badge'
import Card from '../ui/Card'
import TaskStatusBadge from './TaskStatusBadge'
import type { Task } from '../../types/domain'

/** Compact reminder of the academic task, used on pages that sit around the workspace. */
export default function TaskContextBanner({ task }: { task: Task }) {
  return (
    <Card tone="softBlue" className="context">
      <div className="context__top">
        <Badge tone="blue">{task.subject}</Badge>
        <TaskStatusBadge status={task.status} />
      </div>
      <h2 className="section-title">{task.title}</h2>
      <p>{task.description}</p>
    </Card>
  )
}
