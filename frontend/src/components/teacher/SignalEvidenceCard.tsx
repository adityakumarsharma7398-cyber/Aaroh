import Card from '../ui/Card'
import EvidenceTimeline from '../evidence/EvidenceTimeline'
import { SignalBadge } from '../ui/SignalList'
import { DIMENSION_DESCRIPTIONS } from '../../content/dimensions'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import type { DevelopmentDimension, DevelopmentSignal, EvidenceEvent } from '../../types/domain'

type Props = {
  dimension: DevelopmentDimension
  signal?: DevelopmentSignal
  /** The events this signal rests on, already resolved. */
  evidence: EvidenceEvent[]
  taskTitles: Record<string, string>
}

/** One dimension for one student: the signal, the reason it is shown, and the evidence behind it. */
export default function SignalEvidenceCard({ dimension, signal, evidence, taskTitles }: Props) {
  return (
    <Card className="sigev">
      <div className="sigev__head">
        <h3>{DIMENSION_LABELS[dimension]}</h3>
        <SignalBadge trend={signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Not enough evidence yet'} />
      </div>
      {signal ? (
        <>
          <p>{signal.summary}</p>
          <details className="sigev__why">
            <summary>Why is this signal shown? ({evidence.length} recorded {evidence.length === 1 ? 'action' : 'actions'})</summary>
            <EvidenceTimeline events={evidence} taskTitles={taskTitles} />
          </details>
        </>
      ) : (
        <p className="note">{DIMENSION_DESCRIPTIONS[dimension]} No signal is shown because there is not enough evidence yet.</p>
      )}
    </Card>
  )
}
