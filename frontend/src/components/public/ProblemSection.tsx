import Card from '../ui/Card'
import IconContainer from '../ui/IconContainer'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { PROBLEM_MISSING, PROBLEM_TRACKED } from '../../content/landing'

export default function ProblemSection() {
  return (
    <section className="section" aria-labelledby="problem-title">
      <div className="container">
        <Reveal>
          <SectionHeading
            id="problem-title"
            eyebrow="The problem"
            eyebrowTone="blue"
            title="Students are measured on what they know. Not how they grow."
          >
            Academic platforms are good at tracking the outcome. They rarely keep structured evidence of the development behind it.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <Card tone="softBlue" big className="tracked">
            <h3>What platforms track well</h3>
            <ul className="chips">
              {PROBLEM_TRACKED.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Card>
        </Reveal>
        <Reveal>
          <h3 className="subhead">What usually goes unrecorded</h3>
          <div className="grid grid--4">
            {PROBLEM_MISSING.map((m) => (
              <Card key={m.title} tone="white" lift className="mini">
                <IconContainer tone={m.tone}>{m.icon}</IconContainer>
                <h4>{m.title}</h4>
                <p>{m.text}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
