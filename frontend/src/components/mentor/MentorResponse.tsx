import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { HINT_LEVEL_DESCRIPTIONS, HINT_LEVEL_NAMES } from '../../content/labels'
import type { HintLevel, MentorHint } from '../../types/domain'

type Props = {
  currentLevel: HintLevel
  /** Hints delivered so far, lowest level first. */
  hints: MentorHint[]
  /** The level the next request would deliver, or undefined at the top of the ladder. */
  nextLevel?: HintLevel
  onRequestNext: () => void
  requesting: boolean
  error?: string
}

export default function MentorResponse({ currentLevel, hints, nextLevel, onRequestNext, requesting, error }: Props) {
  const latest = hints.find((h) => h.level === currentLevel)
  const earlier = hints.filter((h) => h.level < currentLevel)

  return (
    <Card tone="white" big className="mentor-says" aria-live="polite">
      <Badge tone="pink">Mentor · Level {currentLevel}</Badge>
      <h2 className="section-title">{HINT_LEVEL_NAMES[currentLevel]}</h2>

      {latest ? (
        <p className="mentor-says__text">{latest.content}</p>
      ) : (
        <p className="mentor-says__text">
          {HINT_LEVEL_DESCRIPTIONS[0]} Give the problem a real attempt first. When you want guidance, ask for it. You can do
          that at any time.
        </p>
      )}

      {nextLevel !== undefined ? (
        <div className="mentor-says__next">
          <Button variant="action" onClick={onRequestNext} disabled={requesting}>
            {requesting
              ? 'Asking…'
              : nextLevel === 1
                ? 'Request guidance'
                : `Need more help? Request Level ${nextLevel}: ${HINT_LEVEL_NAMES[nextLevel]}`}
          </Button>
          <p className="note">Next: {HINT_LEVEL_DESCRIPTIONS[nextLevel]}</p>
        </div>
      ) : (
        <p className="note">This is the final level. Compare it with your own work, then decide your next step.</p>
      )}

      {error && <p role="alert" className="attempt__error">{error}</p>}

      {earlier.length > 0 && (
        <details className="mentor-says__earlier">
          <summary>Earlier guidance ({earlier.length})</summary>
          <ul>
            {[...earlier].reverse().map((h) => (
              <li key={h.id}>
                <Badge tone="yellow">Level {h.level}: {HINT_LEVEL_NAMES[h.level]}</Badge>
                <p>{h.content}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="note mentor-says__demo">Illustrative mentor content. The AI mentor is not connected yet.</p>
    </Card>
  )
}
