import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { BRAND } from '../../config/brand'
import { FOUNDATION_PRINCIPLES } from '../../content/landing'

const TONES = ['softYellow', 'softBlue', 'softOrange', 'softPink'] as const

export default function VivekanandaSection() {
  return (
    <section className="section" aria-labelledby="found-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="found-title" eyebrow="The foundation" eyebrowTone="pink" title="Why Swami Vivekananda?">
            His teachings stressed strength, self-reliance and character built through practical action. {BRAND.shortName} translates
            those principles into concrete development opportunities inside everyday coursework.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <div className="grid grid--3">
            {FOUNDATION_PRINCIPLES.map((p, i) => (
              <Card key={p.name} tone={TONES[i % TONES.length]} lift>
                <h3>{p.name}</h3>
                <p>{p.does}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
