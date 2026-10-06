import Badge from '../ui/Badge'
import Card from '../ui/Card'
import type { GrowthInsight } from '../../types/domain'

export default function GrowthInsightCard({ insight }: { insight: GrowthInsight }) {
  return (
    <Card tone="softPink" className="insight">
      <Badge tone="pink">Growth insight</Badge>
      <h2 className="section-title">One thing to notice</h2>
      <p className="insight__text">{insight.observation}</p>
      <p className="note">Illustrative content until live data is connected.</p>
    </Card>
  )
}
