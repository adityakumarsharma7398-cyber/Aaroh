import Card from '../ui/Card'
import { describeEvent } from '../../lib/evidence'
import { formatEventTime } from '../../lib/format'
import type { EvidenceEvent } from '../../types/domain'

export default function EvidenceList({ events }: { events: EvidenceEvent[] }) {
  return (
    <Card className="evidence">
      <h2 className="section-title">Recent Evidence</h2>
      <p className="evidence__support">Small actions give us a clearer picture of how you&apos;re developing.</p>
      {events.length === 0 ? (
        <p className="note">No actions recorded yet. Evidence appears as you work on tasks.</p>
      ) : (
        <ol className="timeline">
          {events.map((e) => (
            <li key={e.id} className="timeline__item">
              <span className="timeline__dot" aria-hidden="true" />
              <div>
                <p className="timeline__text">{describeEvent(e)}</p>
                <time className="timeline__time" dateTime={e.occurredAt}>{formatEventTime(e.occurredAt)}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="note">These are observable actions, not judgements.</p>
    </Card>
  )
}
