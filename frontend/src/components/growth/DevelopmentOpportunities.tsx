import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { DIMENSION_LABELS } from '../../content/labels'
import type { DevelopmentOpportunity } from '../../types/domain'

export default function DevelopmentOpportunities({ opportunities }: { opportunities: DevelopmentOpportunity[] }) {
  if (opportunities.length === 0) return null
  return (
    <Card tone="softYellow" className="opp">
      <Badge tone="yellow">Development opportunity</Badge>
      <h2 className="section-title">What&apos;s this task helping you develop?</h2>
      <ul className="opp__list">
        {opportunities.map((o) => (
          <li key={o.dimension}>
            <strong>{DIMENSION_LABELS[o.dimension]}</strong>
            <span>{o.reason}</span>
          </li>
        ))}
      </ul>
      <p className="note">These are opportunities, not scores. Growth happens through what you do.</p>
    </Card>
  )
}
