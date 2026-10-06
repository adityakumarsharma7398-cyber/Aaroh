import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import MissionCard from '../../components/missions/MissionCard'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { useMissionsData } from './studentData'

export default function MissionsPage() {
  const state = useMissionsData()

  return (
    <>
      <PageHeader
        title="Missions"
        description="Small, practical actions that grow out of your academic work. They are not quests, just things worth trying."
      />
      <AsyncView state={state} loadingLabel="Loading your missions…">
        {({ missions, taskTitles }) => {
          const open = missions.filter((m) => m.status !== 'completed')
          const done = missions.filter((m) => m.status === 'completed')
          const renderGrid = (items: typeof missions) => (
            <ul className="mission-grid">
              {items.map((m) => (
                <li key={m.id}>
                  <MissionCard mission={m} to={studentRoutes.mission(m.id)} taskTitle={taskTitles[m.taskId]} />
                </li>
              ))}
            </ul>
          )

          return (
            <>
              <section aria-labelledby="open-missions" className="mission-section">
                <h2 id="open-missions" className="subhead">Active and recommended</h2>
                {open.length > 0 ? (
                  renderGrid(open)
                ) : (
                  <Card tone="softYellow">
                    <p>No open missions right now. New ones appear as you work on tasks.</p>
                  </Card>
                )}
              </section>

              <section aria-labelledby="done-missions" className="mission-section">
                <h2 id="done-missions" className="subhead">Completed</h2>
                {done.length > 0 ? (
                  renderGrid(done)
                ) : (
                  <Card>
                    <p>You have not completed a mission yet.</p>
                  </Card>
                )}
              </section>
            </>
          )
        }}
      </AsyncView>
    </>
  )
}
