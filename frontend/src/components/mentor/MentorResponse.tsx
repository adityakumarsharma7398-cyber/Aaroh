import { useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { HINT_LEVEL_DESCRIPTIONS, HINT_LEVEL_NAMES, responseModeLabel } from '../../content/labels'
import type { HintLevel, MentorHint } from '../../types/domain'

type Props = {
  currentLevel: HintLevel
  hints: MentorHint[]
  nextLevel?: HintLevel
  onRequestNext: (questionText?: string) => void
  requesting: boolean
  error?: string
}

export default function MentorResponse({
  currentLevel,
  hints,
  nextLevel,
  onRequestNext,
  requesting,
  error,
}: Props) {
  const [studentInput, setStudentInput] = useState('')
  const latest = hints.find((h) => h.level === currentLevel)
  const earlier = hints.filter((h) => h.level < currentLevel)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRequestNext(studentInput)
  }

  return (
    <Card tone="white" big className="mentor-says" aria-live="polite">
      <div className="mentor-says__badges">
        <Badge tone="yellow">🧠 AAROH Socratic AI</Badge>
        <Badge tone="blue">Server-Controlled · Level {currentLevel}</Badge>
        {latest?.responseMode && <Badge tone="pink">{responseModeLabel(latest.responseMode)}</Badge>}
      </div>

      <div style={{ margin: '8px 0 16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {HINT_LEVEL_NAMES[currentLevel] || 'Socratic Guidance'}
        </h2>
        <span style={{ fontSize: '0.86rem', color: '#555', fontWeight: 600 }}>
          {HINT_LEVEL_DESCRIPTIONS[currentLevel]}
        </span>
      </div>

      {/* Latest AI Guidance Bubble */}
      <div
        style={{
          background: 'var(--soft-yellow)',
          border: '2.5px solid var(--black)',
          borderRadius: '16px',
          boxShadow: '4px 4px 0 var(--black)',
          padding: '18px 20px',
          margin: '12px 0 20px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <strong style={{ font: '700 1.05rem var(--font-head)' }}>AAROH Socratic Mentor:</strong>
        </div>
        <p style={{ fontSize: '1rem', lineHeight: '1.55', whiteSpace: 'pre-wrap', margin: 0 }}>
          {latest ? latest.content : HINT_LEVEL_DESCRIPTIONS[0]}
        </p>
      </div>

      {/* Student Question / Stuck Form */}
      {nextLevel !== undefined ? (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="field__label" htmlFor="student-mentor-input" style={{ fontSize: '0.95rem' }}>
              Tell AAROH what you&apos;ve tried or where you&apos;re stuck:
            </label>
            <textarea
              id="student-mentor-input"
              rows={3}
              placeholder="e.g. I tried isolating x on the left side, but I'm unsure what to do with the fractional coefficients..."
              className="field__input"
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              disabled={requesting}
            />
          </div>

          <div className="mentor-says__next" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <Button type="submit" variant="action" size="lg" arrow disabled={requesting}>
              {requesting
                ? 'AAROH is thinking…'
                : nextLevel === 1
                  ? 'Ask Socratic Mentor →'
                  : `Advance to Level ${nextLevel}: ${HINT_LEVEL_NAMES[nextLevel]} →`}
            </Button>
            <span className="note" style={{ fontSize: '0.85rem' }}>
              Next rung: <strong>{HINT_LEVEL_NAMES[nextLevel]}</strong>
            </span>
          </div>
        </form>
      ) : (
        <div style={{ padding: '12px', background: 'var(--soft-blue)', border: '1.5px solid var(--black)', borderRadius: '10px' }}>
          <p className="note" style={{ margin: 0, fontWeight: 700 }}>
            ✓ You have explored all guidance levels for this challenge. Compare your reasoning with the direct strategy and retry your attempt!
          </p>
        </div>
      )}

      {error && <p role="alert" className="attempt__error" style={{ marginTop: '14px' }}>{error}</p>}

      {/* Earlier Hints Thread */}
      {earlier.length > 0 && (
        <details className="mentor-says__earlier" style={{ marginTop: '24px' }}>
          <summary style={{ fontWeight: 700, cursor: 'pointer', padding: '6px 0' }}>
            Earlier Exchanges ({earlier.length})
          </summary>
          <ul style={{ display: 'grid', gap: '12px', marginTop: '10px', listStyle: 'none', padding: 0 }}>
            {[...earlier].reverse().map((h) => (
              <li
                key={h.id}
                style={{
                  background: 'var(--white)',
                  border: '2px solid var(--black)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '2px 2px 0 var(--black)',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <Badge tone="yellow">Level {h.level}</Badge>
                  <strong style={{ fontSize: '0.92rem' }}>{HINT_LEVEL_NAMES[h.level]}</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{h.content}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  )
}
