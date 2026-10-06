import Card from '../ui/Card'
import { HINT_LEVEL_DESCRIPTIONS, HINT_LEVEL_NAMES } from '../../content/labels'
import { HINT_LEVELS } from '../../lib/mentor'
import type { HintLevel } from '../../types/domain'

const STATE_LABEL = { done: 'Reached', current: 'Current', next: 'Next', later: '' } as const

export default function HintLadder({ currentLevel }: { currentLevel: HintLevel }) {
  return (
    <Card className="hint-ladder">
      <h2 className="section-title">The hint ladder</h2>
      <p className="note">Guidance steps up one level at a time, so you keep room to think.</p>
      <ol aria-label="Hint levels">
        {HINT_LEVELS.map((level) => {
          const state =
            level < currentLevel ? 'done' : level === currentLevel ? 'current' : level === currentLevel + 1 ? 'next' : 'later'
          return (
            <li key={level} className={`rung rung--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="rung__id">L{level}</span>
              <span className="rung__text">
                <strong>{HINT_LEVEL_NAMES[level]}</strong>
                <span>{HINT_LEVEL_DESCRIPTIONS[level]}</span>
              </span>
              {STATE_LABEL[state] && <span className="rung__state">{STATE_LABEL[state]}</span>}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
