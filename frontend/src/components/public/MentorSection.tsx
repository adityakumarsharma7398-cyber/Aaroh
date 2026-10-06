import { useState } from 'react'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { DEFAULT_HINT_LEVEL, HINT_LEVELS } from '../../content/landing'

export default function MentorSection() {
  const [active, setActive] = useState(DEFAULT_HINT_LEVEL)
  const level = HINT_LEVELS[active]
  return (
    <section className="section section--tint" aria-labelledby="mentor-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="mentor-title" eyebrow="AI mentor · hint ladder" eyebrowTone="pink" title="An AI mentor that doesn't hand over the answer.">
            The mentor adapts assistance without replacing the student&apos;s thinking. Each step up the ladder is a choice, and it is recorded.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <div className="mentor__panel">
            <ol className="ladder" aria-label="Hint ladder levels">
              {HINT_LEVELS.map((l, i) => (
                <li key={l.id} className="ladder__item" style={{ ['--step' as string]: i }}>
                  <button
                    type="button"
                    className={`ladder__rung${i === active ? ' is-active' : ''}`}
                    aria-pressed={i === active}
                    onClick={() => setActive(i)}
                  >
                    <b>{l.id}</b> {l.name}
                  </button>
                </li>
              ))}
            </ol>
            <Card tone="white" big className="mentor__says" aria-live="polite">
              <Badge tone="pink">Mentor at {level.id}</Badge>
              <h3>{level.name}</h3>
              <p>{level.says}</p>
            </Card>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
