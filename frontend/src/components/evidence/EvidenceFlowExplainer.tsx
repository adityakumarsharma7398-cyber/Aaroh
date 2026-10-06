import Card from '../ui/Card'

type Step = { tone: 'softBlue' | 'softYellow' | 'softOrange' | 'softPink'; title: string; text: string }

const STUDENT_STEPS: Step[] = [
  { tone: 'softBlue', title: 'Action', text: 'You do something observable, such as saving an attempt or asking for a hint.' },
  { tone: 'softYellow', title: 'Evidence', text: 'Each action is recorded as an event. Recording does not judge it.' },
  { tone: 'softOrange', title: 'Development signal', text: 'Patterns across events can point to a signal, always with the evidence behind it.' },
]

/** Three connected steps. Defaults to the student's Action → Evidence → Signal explanation. */
export default function EvidenceFlowExplainer({ steps = STUDENT_STEPS }: { steps?: Step[] }) {
  return (
    <ol className="flowline" aria-label="How the pieces connect">
      {steps.map((s, i) => (
        <li key={s.title} className="flowline__item">
          <Card tone={s.tone} className="flowline__card">
            <strong>{s.title}</strong>
            <p>{s.text}</p>
          </Card>
          {i < steps.length - 1 && <span className="flowline__arrow" aria-hidden="true">→</span>}
        </li>
      ))}
    </ol>
  )
}
