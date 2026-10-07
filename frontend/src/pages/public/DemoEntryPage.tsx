import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { LogoMark } from '../../components/ui/Logo'
import { BRAND } from '../../config/brand'

export default function DemoEntryPage() {
  const navigate = useNavigate()

  return (
    <section className="section demo-entry-page">
      <div className="container demo-entry-container">
        <div className="demo-entry__header">
          <Badge tone="yellow">Demo Mode • Vivekananda Innovation Hackathon</Badge>
          <div className="demo-entry__title-wrap">
            <LogoMark className="demo-entry__logo" />
            <h1>Enter the {BRAND.name} Experience</h1>
          </div>
          <p className="lead">
            Select a verified demo persona to experience the human-development layer in action.
          </p>
        </div>

        <div className="demo-entry__cards">
          {/* Student Persona */}
          <Card big tone="white" className="demo-card demo-card--student">
            <div className="demo-card__header">
              <Badge tone="blue">Student Perspective</Badge>
              <span className="demo-card__badge">Live Active Demo</span>
            </div>
            <h2>Maya Chen</h2>
            <p className="demo-card__role">Student • Grade 10 Algebra & Modeling</p>
            <p className="demo-card__desc">
              Experience the core student loop: tackle academic challenges, receive server-controlled Socratic AI guidance, retry with perseverance, and track observable growth signals.
            </p>
            <ul className="demo-card__features">
              <li>✓ Interactive Academic Task Workspace</li>
              <li>✓ Server-Controlled AI Mentor (0-5 Hint Ladder)</li>
              <li>✓ Mission Execution & Structured Reflection</li>
              <li>✓ Visual 5-Dimension Growth Compass</li>
            </ul>
            <div className="demo-card__actions">
              <Button
                variant="action"
                size="lg"
                arrow
                onClick={() => {
                  navigate('/student/today')
                }}
              >
                Enter as Student Maya →
              </Button>
            </div>
          </Card>

          {/* Teacher Persona */}
          <Card big tone="softYellow" className="demo-card demo-card--teacher">
            <div className="demo-card__header">
              <Badge tone="yellow">Teacher Perspective</Badge>
              <span className="demo-card__badge">Insight & Observations</span>
            </div>
            <h2>Dr. Sarah Adams</h2>
            <p className="demo-card__role">Educator • Mathematics & Applied Sciences</p>
            <p className="demo-card__desc">
              Explore qualitative student development insights without surveillance or numerical score tracking. View evidence-backed development signals and log qualitative classroom observations.
            </p>
            <ul className="demo-card__features">
              <li>✓ Class Cohort Development Signals</li>
              <li>✓ Student Observable Evidence Feeds</li>
              <li>✓ Qualitative Observation Logging</li>
              <li>✓ Growth Compass Class Summary</li>
            </ul>
            <div className="demo-card__actions">
              <Button
                variant="light"
                size="lg"
                arrow
                onClick={() => {
                  navigate('/teacher/overview')
                }}
              >
                Enter as Teacher Adams →
              </Button>
            </div>
          </Card>
        </div>

        <div className="demo-entry__footer">
          <p className="note">
            AAROH operates on verified student actions and qualitative evidence. No XP, leaderboards, surveillance, or numerical personality scores.
          </p>
        </div>
      </div>
    </section>
  )
}
