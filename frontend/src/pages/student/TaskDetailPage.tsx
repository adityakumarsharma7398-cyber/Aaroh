import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import DevelopmentOpportunities from '../../components/growth/DevelopmentOpportunities'
import MissionCard from '../../components/missions/MissionCard'
import AttemptEditor from '../../components/tasks/AttemptEditor'
import AttemptHistory from '../../components/tasks/AttemptHistory'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { formatClock, formatMinutes } from '../../lib/format'
import { taskService } from '../../services/taskService'
import type { Mission, Task, TaskAttempt } from '../../types/domain'
import { useTaskWorkspaceData } from './studentData'

interface WorkspaceProps {
  task: Task
  attempts: TaskAttempt[]
  mission?: Mission
  reload: () => void
}

function TaskWorkspace({ task, attempts, mission, reload }: WorkspaceProps) {
  const navigate = useNavigate()
  const latestSaved = attempts[0]?.content ?? ''
  const [draft, setDraft] = useState(latestSaved)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [savedAt, setSavedAt] = useState<string>()
  const [error, setError] = useState<string>()

  const dirty = draft !== latestSaved
  const completed = task.status === 'completed'

  async function saveAttempt() {
    setSaving(true)
    setError(undefined)
    try {
      const attempt = await taskService.saveAttempt(task.id, draft)
      setSavedAt(formatClock(attempt.createdAt))
      reload()
    } catch {
      setError('We could not save your attempt. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function markComplete() {
    setCompleting(true)
    setError(undefined)
    try {
      await taskService.completeTask(task.id)
      navigate(studentRoutes.taskComplete(task.id))
    } catch {
      setError('We could not mark this task complete. Please try again.')
      setCompleting(false)
    }
  }

  return (
    <>
      <BackLink to={studentRoutes.tasks}>All tasks</BackLink>
      <PageHeader title={task.title} description={task.description} />

      <div className="task-meta">
        <Badge tone="blue">{task.subject}</Badge>
        <TaskStatusBadge status={task.status} />
        <span><strong>Estimated effort:</strong> {formatMinutes(task.estimatedMinutes)}</span>
      </div>

      <div className="workspace">
        <div className="workspace__main">
          {completed && (
            <Card tone="success" className="workspace__done">
              <strong>This task is marked complete.</strong>
              <div className="workspace__done-links">
                <Button to={studentRoutes.taskComplete(task.id)} variant="light">View summary</Button>
                <Button to={studentRoutes.reflection(task.id)} variant="light">Reflection</Button>
              </div>
            </Card>
          )}

          <Card tone="softYellow" className="tryfirst">
            <Badge tone="yellow">Try it yourself first</Badge>
            <p>
              Give the problem a real attempt before asking for help. Write down what you try, what you expect, and
              where you get stuck. You can ask the mentor whenever you choose.
            </p>
          </Card>

          <AttemptEditor
            value={draft}
            onChange={setDraft}
            onSave={saveAttempt}
            saving={saving}
            dirty={dirty}
            savedAtLabel={savedAt}
            error={error}
            actions={
              <>
                <Button to={studentRoutes.taskMentor(task.id)} variant="light">Ask Mentor</Button>
                {!completed && (
                  <Button variant="action" onClick={markComplete} disabled={completing}>
                    {completing ? 'Completing…' : 'Mark Task Complete'}
                  </Button>
                )}
              </>
            }
          />
        </div>

        <div className="workspace__side">
          <DevelopmentOpportunities opportunities={task.opportunities} />
          {mission && <MissionCard mission={mission} to={studentRoutes.mission(mission.id)} />}
          <AttemptHistory attempts={attempts} />
        </div>
      </div>
    </>
  )
}

export default function TaskDetailPage() {
  const { taskId = '' } = useParams()
  const state = useTaskWorkspaceData(taskId)

  return (
    <AsyncView state={state} loadingLabel="Loading your task…">
      {(data) =>
        data ? (
          <TaskWorkspace key={data.task.id} {...data} reload={state.reload} />
        ) : (
          <NotFoundState
            title="We couldn't find that task"
            message="It may have been removed, or the link may be wrong."
            backTo={studentRoutes.tasks}
            backLabel="Back to My Tasks"
          />
        )
      }
    </AsyncView>
  )
}
