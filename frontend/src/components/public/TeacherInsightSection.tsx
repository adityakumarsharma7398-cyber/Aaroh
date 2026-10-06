import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import SignalList from '../ui/SignalList'
import { TEACHER_EXAMPLE as EX } from '../../content/landing'

export default function TeacherInsightSection() {
  return (
    <section className="section section--tint" aria-labelledby="teacher-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="teacher-title" eyebrow="Teacher insight" eyebrowTone="orange" title="Teachers mentor. They don't do data entry.">
            Development signals appear next to academic progress, each with its evidence trail, so a teacher can start a better conversation.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <div className="teacher">
            <Card tone="white" big>
              <Badge tone="blue">Academic progress</Badge>
              <p className="teacher__metric">{EX.course} <strong>{EX.progress}</strong></p>
              <Badge tone="yellow">Development signals</Badge>
              <SignalList signals={EX.signals} />
            </Card>
            <Card tone="softPink" big>
              <Badge tone="pink">{EX.whyQuestion}</Badge>
              <ol className="trail">
                {EX.trail.map((t) => <li key={t}>{t}</li>)}
              </ol>
              <p className="note">Example data for illustration.</p>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
