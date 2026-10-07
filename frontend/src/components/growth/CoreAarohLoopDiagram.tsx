import Card from '../ui/Card'
import Badge from '../ui/Badge'

interface Props {
  compact?: boolean
  title?: string
}

const LOOP_STEPS = [
  {
    stage: '01',
    title: 'Academic Work',
    subtitle: 'Standard Curricular Task',
    desc: 'Math, Science, or Humanities problem statement assigned to student.',
    icon: '📚',
    tone: 'white',
  },
  {
    stage: '02',
    title: 'Student Action',
    subtitle: 'Independent Attempt',
    desc: 'Student works through the problem and records their initial reasoning.',
    icon: '✏️',
    tone: 'blue',
  },
  {
    stage: '03',
    title: 'AAROH AI Guidance',
    subtitle: 'Socratic Hint Ladder (0-5)',
    desc: 'Server-controlled Socratic questions encouraging productive difficulty.',
    icon: '🧠',
    tone: 'yellow',
  },
  {
    stage: '04',
    title: 'Retry & Reflection',
    subtitle: 'Iterative Persistence',
    desc: 'Applying feedback, adjusting logic, and reflecting on the learning journey.',
    icon: '🔄',
    tone: 'white',
  },
  {
    stage: '05',
    title: 'Observable Evidence',
    subtitle: 'Fact-Based Action Log',
    desc: 'Verified actions logged (attempts, retries, reflections) without judgment.',
    icon: '🔍',
    tone: 'blue',
  },
  {
    stage: '06',
    title: 'Development Signal',
    subtitle: 'Rule-Engine Synthesis',
    desc: 'Explainable qualitative trends (Perseverance, Self-Reliance, Initiative).',
    icon: '🌱',
    tone: 'yellow',
  },
  {
    stage: '07',
    title: 'Growth Compass',
    subtitle: 'Holistic Student & Teacher View',
    desc: '5-dimension radial visualization without XP, rankings, or scores.',
    icon: '🧭',
    tone: 'action',
  },
]

export default function CoreAarohLoopDiagram({ compact = false, title = 'The AAROH Human-Development Loop' }: Props) {
  return (
    <Card tone="softPink" big={!compact} className="core-loop-card" style={{ border: '3px solid var(--black)', borderRadius: '20px', boxShadow: '5px 5px 0 var(--black)', padding: '24px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <Badge tone="yellow">Core Product Loop</Badge>
          <h3 style={{ font: '700 1.4rem var(--font-head)', margin: '6px 0 0' }}>{title}</h3>
        </div>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#444' }}>
          7 Connected Stages
        </span>
      </div>

      <div
        className="core-loop-grid"
        style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 145px), 1fr))',
          alignItems: 'stretch',
        }}
      >
        {LOOP_STEPS.map((step) => (
          <div
            key={step.stage}
            className="core-loop-node"
            style={{
              background: step.tone === 'action' ? 'var(--orange)' : step.tone === 'yellow' ? 'var(--soft-yellow)' : step.tone === 'blue' ? 'var(--soft-blue)' : 'var(--white)',
              border: '2px solid var(--black)',
              borderRadius: '14px',
              boxShadow: '3px 3px 0 var(--black)',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ font: '700 0.8rem var(--font-head)', color: '#444' }}>{step.stage}</span>
              <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>
            </div>
            <strong style={{ font: '700 0.92rem/1.2 var(--font-head)', marginBottom: '4px' }}>{step.title}</strong>
            <span style={{ font: '700 0.72rem/1.2 var(--font-body)', color: 'var(--blue)', marginBottom: '6px', textTransform: 'uppercase' }}>
              {step.subtitle}
            </span>
            <p style={{ fontSize: '0.78rem', color: '#333', lineHeight: '1.35', margin: 'auto 0 0' }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
