import Card from '../ui/Card'
import { formatEventTime } from '../../lib/format'
import type { TaskAttempt } from '../../types/domain'

/** Earlier saved attempts, newest first. Each opens to show what was written. */
export default function AttemptHistory({ attempts }: { attempts: TaskAttempt[] }) {
  if (attempts.length === 0) return null
  return (
    <Card className="history">
      <h2 className="section-title">Saved attempts</h2>
      <ul className="history__list">
        {attempts.map((a, i) => (
          <li key={a.id}>
            <details>
              <summary>
                Attempt {attempts.length - i} <time dateTime={a.createdAt}>{formatEventTime(a.createdAt)}</time>
              </summary>
              <pre className="history__content">{a.content}</pre>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  )
}
