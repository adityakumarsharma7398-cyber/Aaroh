import { useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import DevelopmentOpportunities from '../../components/growth/DevelopmentOpportunities'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { HINT_LEVEL_NAMES } from '../../content/labels'
import { studentRoutes } from '../../config/routes'
import { summariseTaskWork } from '../../lib/evidence'
import { useCompletionData } from './studentData'

export default function TaskCompletePage() {
  const { taskId = '' } = useParams()
  const state = useCompletionData(taskId)

  return (
    <AsyncView state={state} loadingLabel="Loading your summary…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We couldn't find that task"
              message="There is no summary to show."
              backTo={studentRoutes.tasks}
              backLabel="Back to My Tasks"
            />
          )
        }
        const { task, events, attempts } = data

        if (task.status !== 'completed') {
          return (
            <>
              <BackLink to={studentRoutes.task(task.id)}>Back to task</BackLink>
              <PageHeader title="Not completed yet" description={task.title} />
              <Card tone="softYellow" big>
                <p>This task has not been marked complete, so there is no summary yet.</p>
                <Button to={studentRoutes.task(task.id)} variant="action">Go to the task</Button>
              </Card>
            </>
          )
        }

        const summary = summariseTaskWork(events, attempts)
        return (
          <>
            <BackLink to={studentRoutes.tasks}>All tasks</BackLink>
            <PageHeader title="Task completed" description={task.title} />

            <div className="complete">
              <Card tone="success" big className="complete__hero">
                <Badge tone="success">✓ Completed</Badge>
                <h2 className="section-title">Your work on this task is recorded.</h2>
                <p>Here is what you did. The next step is a short reflection.</p>
                <Button to={studentRoutes.reflection(task.id)} variant="action" size="lg" arrow>
                  Continue to Reflection
                </Button>
              </Card>

              <Card className="complete__summary">
                <h2 className="section-title">Summary of your work</h2>
                <dl className="facts">
                  <div>
                    <dt>Attempts saved</dt>
                    <dd>{summary.attemptsSaved}</dd>
                  </div>
                  <div>
                    <dt>Hints requested</dt>
                    <dd>
                      {summary.hintsRequested}
                      {summary.highestHintLevel !== undefined && (
                        <span className="facts__sub">
                          Highest: Level {summary.highestHintLevel}, {HINT_LEVEL_NAMES[summary.highestHintLevel]}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                {attempts[0] ? (
                  <details>
                    <summary>Your latest attempt</summary>
                    <pre className="history__content">{attempts[0].content}</pre>
                  </details>
                ) : (
                  <p className="note">No attempt was saved on this task.</p>
                )}
              </Card>

              <Card className="complete__actions">
                <h2 className="section-title">Observed actions on this task</h2>
                <EvidenceTimeline events={events} emptyText="No actions were recorded for this task." />
              </Card>

              <div className="complete__opp">
                <DevelopmentOpportunities opportunities={task.opportunities} />
              </div>
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
