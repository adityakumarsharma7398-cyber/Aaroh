import { useState } from 'react'
import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import ActivityCard from '../../components/teacher/ActivityCard'
import ActivityForm from '../../components/teacher/ActivityForm'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { tasksByActivity } from '../../lib/teacher'
import { activityService } from '../../services/activityService'
import type { Activity, ActivityInput, Task } from '../../types/domain'
import { useActivitiesData } from './teacherData'

interface ViewProps {
  activities: Activity[]
  tasks: Task[]
  studentNames: Record<string, string>
  onCreate: (input: ActivityInput) => Promise<void>
}

function ActivitiesView({ activities, tasks, studentNames, onCreate }: ViewProps) {
  const [subject, setSubject] = useState('all')
  const [creating, setCreating] = useState(false)

  const subjects = [...new Set(activities.map((a) => a.subject))].sort((a, b) => a.localeCompare(b))
  const grouped = tasksByActivity(tasks)
  const visible = activities.filter((a) => subject === 'all' || a.subject === subject)

  return (
    <>
      <div className="activities__bar">
        {subjects.length > 1 && (
          <label className="filters__subject">
            <span>Subject</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {!creating && <Button variant="action" onClick={() => setCreating(true)}>New activity</Button>}
      </div>

      {creating && (
        <ActivityForm
          onCancel={() => setCreating(false)}
          onSubmit={async (input) => {
            await onCreate(input)
            setCreating(false)
          }}
        />
      )}

      <p role="status" className="note tasks__count">
        Showing {visible.length} of {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
      </p>

      {visible.length === 0 ? (
        <Card tone="softYellow" big className="tasks__empty">
          <h2 className="section-title">No activities match.</h2>
          <p>Try another subject, or create a new activity.</p>
        </Card>
      ) : (
        <ul className="activity-grid">
          {visible.map((a) => (
            <li key={a.id}>
              <ActivityCard activity={a} tasks={grouped[a.id] ?? []} studentNames={studentNames} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function ActivitiesPage() {
  const state = useActivitiesData()

  async function create(input: ActivityInput) {
    await activityService.createActivity(input)
    state.reload()
  }

  return (
    <>
      <PageHeader
        title="Activities"
        description="The academic work your students do, and the development opportunities that come with it."
      />
      <AsyncView state={state} loadingLabel="Loading activities…">
        {(d) => <ActivitiesView {...d} onCreate={create} />}
      </AsyncView>
    </>
  )
}
