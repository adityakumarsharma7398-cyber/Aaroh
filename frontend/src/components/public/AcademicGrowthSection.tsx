import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { BRAND } from '../../config/brand'
import { ACADEMIC_EXAMPLE as EX } from '../../content/landing'

export default function AcademicGrowthSection() {
  return (
    <section className="section" aria-labelledby="academic-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="academic-title" eyebrow="Academic work → development" eyebrowTone="blue" title="The same task. Now it builds something more.">
            No extra homework. {BRAND.shortName} finds the development opportunity already inside the work.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <div className="stack">
            <Card tone="softBlue" big>
              <Badge tone="blue">Academic task</Badge>
              <p className="quote-task">&ldquo;{EX.task}&rdquo;</p>
            </Card>
            <span className="stack__arrow" aria-hidden="true">↓</span>
            <Card tone="softYellow" big>
              <Badge tone="yellow">Development opportunities</Badge>
              <ul className="chips chips--solid">
                {EX.opportunities.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </Card>
            <span className="stack__arrow" aria-hidden="true">↓</span>
            <Card tone="softOrange" big>
              <Badge tone="orange">Growth mission</Badge>
              <p className="quote-task">{EX.mission}</p>
              <ol className="loop" aria-label="Expected path">
                {EX.loop.map((l, i) => (
                  <li key={l}>
                    <span>{l}</span>
                    {i < EX.loop.length - 1 && <b aria-hidden="true">→</b>}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
