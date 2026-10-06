import Badge from '../ui/Badge'
import Card from '../ui/Card'
import SignalList, { type SignalItem } from '../ui/SignalList'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import type { DevelopmentDimension, DevelopmentSignal } from '../../types/domain'

type Props = {
  /** Dimensions to show, in order. A dimension without a signal gets a neutral state. */
  dimensions: DevelopmentDimension[]
  signals: DevelopmentSignal[]
}

export default function DevelopmentSnapshot({ dimensions, signals }: Props) {
  const items: SignalItem[] = dimensions.map((dimension) => {
    const signal = signals.find((s) => s.dimension === dimension)
    return {
      label: DIMENSION_LABELS[dimension],
      trend: signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Not enough evidence yet',
    }
  })

  return (
    <Card className="snapshot">
      <Badge tone="blue">Development snapshot</Badge>
      <h2 className="section-title">Where your evidence points</h2>
      <SignalList signals={items} />
      <p className="note">Each signal is based on observable evidence. It describes a pattern in your actions, not who you are.</p>
    </Card>
  )
}
