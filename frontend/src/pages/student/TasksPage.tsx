import { useMemo, useState } from 'react'
import ErrorNotice from '../../components/layout/ErrorNotice'
import PageHeader from '../../components/layout/PageHeader'
import TaskCard from '../../components/tasks/TaskCard'
import TaskFilters from '../../components/tasks/TaskFilters'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import {
  countByStatusFilter,
  filterTasks,
  listSubjects,
  sortByFocus,
  type StatusFilter,
  type SubjectFilter,
} from '../../lib/tasks'
import { useTasksData } from './useTasksData'

const HEADER = {
  title: 'My Tasks',
  description: 'Your academic work, with opportunities to grow through it.',
}

export default function TasksPage() {
  const state = useTasksData()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [subject, setSubject] = useState<SubjectFilter>('all')

  const tasks = useMemo(() => (state.status === 'ready' ? sortByFocus(state.data.tasks) : []), [state])
  const visible = useMemo(() => filterTasks(tasks, status, subject), [tasks, status, subject])
  const subjects = useMemo(() => listSubjects(tasks), [tasks])
  const counts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: tasks.length,
      'not-started': countByStatusFilter(tasks, 'not-started'),
      'in-progress': countByStatusFilter(tasks, 'in-progress'),
      completed: countByStatusFilter(tasks, 'completed'),
    }),
    [tasks],
  )

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader {...HEADER} />
        <p role="status" className="note">Loading your tasks…</p>
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <>
        <PageHeader {...HEADER} />
        <ErrorNotice error={state.error} />
      </>
    )
  }

  const { currentTaskId } = state.data
  const filtering = status !== 'all' || subject !== 'all'

  return (
    <>
      <PageHeader {...HEADER} />

      {tasks.length === 0 ? (
        <Card big>
          <h2 className="section-title">No tasks yet</h2>
          <p>When your teachers assign academic work, it will appear here.</p>
        </Card>
      ) : (
        <>
          <TaskFilters
            status={status}
            onStatusChange={setStatus}
            subject={subject}
            onSubjectChange={setSubject}
            subjects={subjects}
            counts={counts}
          />
          <p role="status" className="note tasks__count">
            Showing {visible.length} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </p>

          {visible.length === 0 ? (
            <Card tone="softYellow" big className="tasks__empty">
              <h2 className="section-title">No tasks match this filter.</h2>
              <p>Try a different status or subject.</p>
              {filtering && (
                <Button
                  variant="light"
                  onClick={() => {
                    setStatus('all')
                    setSubject('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Card>
          ) : (
            <ul className="task-grid">
              {visible.map((task) => (
                <li key={task.id}>
                  <TaskCard task={task} to={studentRoutes.task(task.id)} isCurrentFocus={task.id === currentTaskId} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
