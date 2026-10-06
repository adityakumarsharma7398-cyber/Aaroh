import Card from '../ui/Card'
import { formatShortDate } from '../../lib/format'
import type { ActivitySummary as Summary } from '../../lib/teacher'

/** Plain counts of academic activity. No ratings, no comparison between students. */
export default function ActivitySummary({ summary }: { summary: Summary }) {
  return (
    <Card className="t-summary">
      <h2 className="section-title">Academic activity</h2>
      <dl className="facts">
        <div>
          <dt>Students with work in progress</dt>
          <dd>
            {summary.studentsWorking}
            <span className="facts__sub">of {summary.studentCount} students</span>
          </dd>
        </div>
        <div>
          <dt>Tasks in progress</dt>
          <dd>{summary.tasksInProgress}</dd>
        </div>
        <div>
          <dt>Tasks completed</dt>
          <dd>
            {summary.tasksCompleted}
            <span className="facts__sub">of {summary.taskTotal} tasks</span>
          </dd>
        </div>
        <div>
          <dt>Recent actions</dt>
          <dd>
            {summary.recentActions}
            {summary.windowEnd && <span className="facts__sub">7 days to {formatShortDate(summary.windowEnd)}</span>}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
