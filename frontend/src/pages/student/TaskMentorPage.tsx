import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import HintLadder from '../../components/mentor/HintLadder'
import MentorResponse from '../../components/mentor/MentorResponse'
import TaskContextBanner from '../../components/tasks/TaskContextBanner'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { actionMessage } from '../../lib/errors'
import { nextHintLevel } from '../../lib/mentor'
import { mentorService } from '../../services/mentorService'
import type { MentorSession, Task, TaskAttempt } from '../../types/domain'
import { useMentorData } from './studentData'

interface MentorProps {
  task: Task
  session: MentorSession
  attempts: TaskAttempt[]
  reload: () => void
}

function MentorView({ task, session, attempts, reload }: MentorProps) {
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string>()
  const nextLevel = nextHintLevel(session.currentLevel)

  async function requestNext(questionText?: string) {
    if (nextLevel === undefined) return
    setRequesting(true)
    setError(undefined)
    try {
      await mentorService.requestHint(task.id, questionText)
      reload()
    } catch (err) {
      setError(actionMessage(err, 'We could not get guidance just now. Please try again.'))
    } finally {
      setRequesting(false)
    }
  }

  return (
    <>
      <BackLink to={studentRoutes.task(task.id)}>Back to task</BackLink>
      <PageHeader title="Mentor" description="Guidance for this task, one step at a time. You stay in charge of the thinking." />

      <div className="mentor-page__context">
        <TaskContextBanner task={task} />
        {attempts[0] && (
          <Card className="context__attempt">
            <details>
              <summary>Your latest attempt</summary>
              <pre className="history__content">{attempts[0].content}</pre>
            </details>
          </Card>
        )}
      </div>

      <div className="mentor-page">
        <div className="mentor-page__response">
          <MentorResponse
            currentLevel={session.currentLevel}
            hints={session.hints}
            nextLevel={nextLevel}
            onRequestNext={requestNext}
            requesting={requesting}
            error={error}
          />
        </div>
        <div className="mentor-page__ladder">
          <HintLadder currentLevel={session.currentLevel} />
        </div>
      </div>

      <div className="mentor-page__back">
        <Button to={studentRoutes.task(task.id)} variant="light">Back to task</Button>
      </div>
    </>
  )
}

export default function TaskMentorPage() {
  const { taskId = '' } = useParams()
  const state = useMentorData(taskId)

  return (
    <AsyncView state={state} loadingLabel="Loading the mentor…">
      {(data) =>
        data ? (
          <MentorView key={data.task.id} {...data} reload={state.reload} />
        ) : (
          <NotFoundState
            title="We couldn't find that task"
            message="The mentor needs a task to work with."
            backTo={studentRoutes.tasks}
            backLabel="Back to My Tasks"
          />
        )
      }
    </AsyncView>
  )
}
