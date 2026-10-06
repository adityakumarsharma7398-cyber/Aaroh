import Badge from '../ui/Badge'
import { TASK_STATUS_LABELS } from '../../content/labels'
import type { TaskStatus } from '../../types/domain'

// Each status differs by glyph and text as well as colour, so it never relies on colour alone.
const STATUS_UI = {
  'not-started': { tone: 'white', glyph: '○' },
  'in-progress': { tone: 'yellow', glyph: '◐' },
  submitted: { tone: 'info', glyph: '➜' },
  completed: { tone: 'success', glyph: '✓' },
} as const

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const ui = STATUS_UI[status]
  return (
    <Badge tone={ui.tone}>
      <span aria-hidden="true">{ui.glyph} </span>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}
