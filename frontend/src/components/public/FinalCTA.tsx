import Button from '../ui/Button'
import Reveal from '../ui/Reveal'

export default function FinalCTA() {
  return (
    <section className="section" aria-labelledby="cta-title">
      <div className="container">
        <Reveal>
          <div className="cta">
            <h2 id="cta-title">Learning doesn&apos;t end when the task is complete.</h2>
            <p className="lead">
              Every attempt, setback, retry and reflection can become part of a student&apos;s development journey.
            </p>
            <div className="hero__cta">
              <Button to="/signup" variant="action" size="lg" arrow>Start Your Journey</Button>
              <Button to="/how-it-works" variant="light" size="lg">Explore How It Works</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
