import { Link, useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import SignalExplanation from '../../components/growth/SignalExplanation'
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge'
import Card from '../../components/ui/Card'
import { DIMENSION_DESCRIPTIONS } from '../../content/dimensions'
import { DIMENSION_LABELS } from '../../content/labels'
import { studentRoutes } from '../../config/routes'
import { sortEvents } from '../../lib/evidence'
import { useDimensionData } from './studentData'

export default function DimensionDetailPage() {
  const { dimension = '' } = useParams()
  const state = useDimensionData(dimension)

  return (
    <AsyncView state={state} loadingLabel="Loading…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We don't have that dimension"
              message="Pick one from your growth overview."
              backTo={studentRoutes.growth}
              backLabel="Back to My Growth"
            />
          )
        }
        const { dimension: dim, signal, events, taskTitles, tasks, completedMissions } = data

        return (
          <>
            <BackLink to={studentRoutes.growth}>My Growth</BackLink>
            <PageHeader title={DIMENSION_LABELS[dim]} description={DIMENSION_DESCRIPTIONS[dim]} />

            <div className="dimension">
              <SignalExplanation signal={signal} />

              <Card big>
                <h2 className="section-title">Supporting evidence</h2>
                <EvidenceTimeline
                  events={sortEvents(events, 'newest')}
                  taskTitles={taskTitles}
                  emptyText="No recorded actions support a signal here yet."
                />
              </Card>

              <div className="dimension__lists">
                <Card tone="softOrange">
                  <h2 className="section-title">Completed missions</h2>
                  {completedMissions.length > 0 ? (
                    <ul className="link-list">
                      {completedMissions.map((m) => (
                        <li key={m.id}><Link to={studentRoutes.mission(m.id)}>{m.title}</Link></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="note">No completed missions for this dimension yet.</p>
                  )}
                </Card>

                <Card tone="softBlue">
                  <h2 className="section-title">Academic tasks that connect to this</h2>
                  {tasks.length > 0 ? (
                    <ul className="link-list">
                      {tasks.map((t) => (
                        <li key={t.id}>
                          <Link to={studentRoutes.task(t.id)}>{t.title}</Link>
                          <TaskStatusBadge status={t.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="note">No tasks connect to this dimension yet.</p>
                  )}
                </Card>
              </div>
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
