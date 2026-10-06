import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { SignalBadge } from '../ui/SignalList'
import { SIGNAL_TREND_LABELS } from '../../content/labels'
import type { DevelopmentSignal } from '../../types/domain'

/** Says what the current signal is and why, in careful wording. */
export default function SignalExplanation({ signal }: { signal?: DevelopmentSignal }) {
  return (
    <Card tone="softYellow" big>
      <Badge tone="yellow">Current signal</Badge>
      <div className="signal-explain__badge">
        <SignalBadge trend={signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Not enough evidence yet'} />
      </div>
      {signal ? (
        <>
          <h2 className="section-title">Why this signal?</h2>
          <p>{signal.summary}</p>
          <p className="note">
            Observed pattern across {signal.evidenceEventIds.length} recorded actions. This is not a psychological
            assessment, and it can change as new evidence arrives.
          </p>
        </>
      ) : (
        <>
          <h2 className="section-title">Not enough evidence yet</h2>
          <p>There are not enough recorded actions to say anything about this yet. Evidence appears as you work on tasks and missions.</p>
        </>
      )}
    </Card>
  )
}
