import Button from '../ui/Button'
import Card from '../ui/Card'
import { SignalBadge } from '../ui/SignalList'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import { DIMENSION_DESCRIPTIONS } from '../../content/dimensions'
import type { DevelopmentDimension, DevelopmentSignal } from '../../types/domain'

type Props = {
  dimension: DevelopmentDimension
  signal?: DevelopmentSignal
  to: string
}

export default function DimensionCard({ dimension, signal, to }: Props) {
  const count = signal?.evidenceEventIds.length ?? 0
  return (
    <Card lift className="dim-card">
      <h2 className="section-title">{DIMENSION_LABELS[dimension]}</h2>
      <SignalBadge trend={signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Not enough evidence yet'} />
      <p>{DIMENSION_DESCRIPTIONS[dimension]}</p>
      <p className="note">
        {signal ? `Based on ${count} observed ${count === 1 ? 'action' : 'actions'}.` : 'Evidence appears as you work on tasks and missions.'}
      </p>
      <Button to={to} variant="light" arrow>See the evidence</Button>
    </Card>
  )
}
