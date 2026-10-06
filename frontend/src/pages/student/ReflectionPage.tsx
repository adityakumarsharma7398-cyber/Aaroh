import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import ReflectionForm from '../../components/tasks/ReflectionForm'
import TaskContextBanner from '../../components/tasks/TaskContextBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { reflectionService } from '../../services/reflectionService'
import type { ReflectionAnswer } from '../../types/domain'
import { useReflectionData } from './studentData'

export default function ReflectionPage() {
  const { taskId = '' } = useParams()
  const state = useReflectionData(taskId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(answers: ReflectionAnswer[]) {
    setSubmitting(true)
    setError(undefined)
    try {
      await reflectionService.submitReflection(taskId, answers)
      state.reload()
    } catch {
      setError('We could not save your reflection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AsyncView state={state} loadingLabel="Loading your reflection…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We couldn't find that task"
              message="A reflection belongs to a task."
              backTo={studentRoutes.tasks}
              backLabel="Back to My Tasks"
            />
          )
        }
        const { task, prompts, reflection, mission } = data
        const missionOpen = mission && mission.status !== 'completed'

        return (
          <>
            <BackLink to={studentRoutes.task(task.id)}>Back to task</BackLink>
            <PageHeader
              title="Reflect on this task"
              description="A few minutes of looking back helps what you learned stick."
            />
            <div className="reflection">
              <TaskContextBanner task={task} />

              {reflection ? (
                <Card tone="softPink" big>
                  <Badge tone="pink">Reflection saved</Badge>
                  <dl className="qa">
                    {reflection.answers.map((a) => (
                      <div key={a.prompt}>
                        <dt>{a.prompt}</dt>
                        <dd>{a.response}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ) : (
                <ReflectionForm prompts={prompts} onSubmit={submit} submitting={submitting} error={error} />
              )}

              {reflection && (
                <Card tone="softOrange" big className="reflection__next">
                  <Badge tone="orange">What next</Badge>
                  {missionOpen ? (
                    <>
                      <h2 className="section-title">Put it into practice</h2>
                      <p>{mission.title}</p>
                      <Button to={studentRoutes.mission(mission.id)} variant="action" size="lg" arrow>
                        Continue to your Growth Mission
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="section-title">Where to next</h2>
                      <p>There is no open mission for this task. You can look at your growth or pick the next task.</p>
                      <div className="reflection__links">
                        <Button to={studentRoutes.growth} variant="action" arrow>View my growth</Button>
                        <Button to={studentRoutes.tasks} variant="light">Back to My Tasks</Button>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
