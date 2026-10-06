import Badge from '../ui/Badge'
import Button from '../ui/Button'
import GrowthCompass from './GrowthCompass'
import { BRAND } from '../../config/brand'

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <Badge tone="yellow">The Man-Making Engine</Badge>
          <h1 id="hero-title">
            Turn Everyday Learning Into <span className="hl">Personal Growth.</span>
          </h1>
          <p className="lead">
            {BRAND.shortName} connects the academic work students already do with meaningful opportunities to develop
            self-reliance, perseverance, initiative, problem-solving and sustained engagement.
          </p>
          <div className="hero__cta">
            <Button to="/signup" variant="action" size="lg" arrow>Start Your Journey</Button>
            <Button to="/how-it-works" variant="light" size="lg">See How It Works</Button>
          </div>
        </div>

        <GrowthCompass />
      </div>
    </section>
  )
}
