import { useState } from 'react'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import { ENGINE_STEPS } from '../../content/landing'

export default function EngineFlow() {
  const [active, setActive] = useState(0)
  const step = ENGINE_STEPS[active]
  return (
    <section className="section section--tint" aria-labelledby="engine-title">
      <div className="container">
        <Reveal>
          <SectionHeading id="engine-title" eyebrow="How the engine works" eyebrowTone="orange" title="From a task to a growth signal in six steps.">
            Select a step to see what happens there.
          </SectionHeading>
        </Reveal>
        <Reveal>
          <ol className="flow">
            {ENGINE_STEPS.map((s, i) => (
              <li key={s.n} className="flow__item">
                <button
                  type="button"
                  className={`flow__step card--${s.tone}${i === active ? ' is-active' : ''}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="flow__n">{s.n}</span>
                  <span className="flow__label">{s.label}</span>
                </button>
                {i < ENGINE_STEPS.length - 1 && <span className="flow__link" aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <Card tone="white" big className="flow__detail" aria-live="polite">
            <span className="flow__detail-n">{step.n}</span>
            <div>
              <h3>{step.label}</h3>
              <p>{step.text}</p>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
