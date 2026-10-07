import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { DIMENSION_LABELS } from '../../content/labels'
import type { Mission, MissionStatus } from '../../types/domain'

type Props = {
  mission: Mission
  /** Where "Open Mission" goes. Supplied by the page. */
  to: string
  /** Title of the academic task this mission came from. */
  taskTitle?: string
}

const STATUS_UI: Record<MissionStatus, { badge: string; badgeTone: 'orange' | 'yellow' | 'success'; card: 'softOrange' | 'softYellow' | 'white' }> = {
  active: { badge: 'Active growth mission', badgeTone: 'orange', card: 'softOrange' },
  available: { badge: 'Recommended mission', badgeTone: 'yellow', card: 'softYellow' },
  completed: { badge: 'Completed mission', badgeTone: 'success', card: 'white' },
}

export default function MissionCard({ mission, to, taskTitle }: Props) {
  const ui = STATUS_UI[mission.status]
  return (
    <Card tone={ui.card} className="mission">
      <div className="mission__top">
        <Badge tone={ui.badgeTone}>{ui.badge}</Badge>
        <Badge tone="white">{DIMENSION_LABELS[mission.dimension]}</Badge>
      </div>
      <h2 className="section-title">{mission.title}</h2>
      {mission.whyItMatters && <p>{mission.whyItMatters}</p>}
      {mission.action && (
        <div className="mission__action">
          <strong>Small action</strong>
          <p>{mission.action}</p>
        </div>
      )}
      {taskTitle && <p className="note">From the task: {taskTitle}</p>}
      <Button to={to} variant={mission.status === 'completed' ? 'light' : 'action'} arrow>Open Mission</Button>
    </Card>
  )
}
