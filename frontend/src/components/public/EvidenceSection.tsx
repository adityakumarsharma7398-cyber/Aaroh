import { useState } from 'react'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import SignalList from '../ui/SignalList'
import { EVIDENCE_EVENTS, EVIDENCE_SIGNALS } from '../../content/landing'

export default function EvidenceSection() {
  const [why, setWhy] = useState(false)
  return (
    <section className="section" aria-labelledby="evidence-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="evidence-title" eyebrow="Evidence → development signal" eyebrowTone="yellow" title="Signals built from what students actually did.">
            Raw events become evidence. Evidence over time becomes a signal. There is no single &ldquo;character score&rdquo;.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <div className="transform">
            <Card tone="softBlue" big>
              <Badge tone="blue">Raw events</Badge>
              <ol className="events">
                {EVIDENCE_EVENTS.map((e) => <li key={e}>{e}</li>)}
              </ol>
            </Card>
            <span className="transform__arrow" aria-hidden="true">→</span>
            <Card tone="softYellow" big>
              <Badge tone="yellow">Development signal</Badge>
              <SignalList signals={EVIDENCE_SIGNALS} />
              <button type="button" className="why" aria-expanded={why} onClick={() => setWhy((w) => !w)}>
                Why? {why ? '−' : '+'}
              </button>
              {why && (
                <p className="why__body">
                  Based on observable evidence only: the student attempted first, asked for a mid-level hint rather than the solution,
                  then retried and finished. Signals describe patterns in actions, not a judgement of the person.
                </p>
              )}
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
