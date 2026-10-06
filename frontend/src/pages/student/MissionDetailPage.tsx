import { Link, useParams } from 'react-router-dom'
import BackLink from '../../components/layout/BackLink'
import AsyncView from '../../components/layout/AsyncView'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { DIMENSION_DESCRIPTIONS } from '../../content/dimensions'
import { DIMENSION_LABELS, MISSION_STATUS_LABELS } from '../../content/labels'
import { studentRoutes } from '../../config/routes'
import { formatEventTime } from '../../lib/format'
import { useMissionData } from './studentData'

export default function MissionDetailPage() {
  const { missionId = '' } = useParams()
  const state = useMissionData(missionId)

  return (
    <AsyncView state={state} loadingLabel="Loading your mission…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We couldn't find that mission"
              message="It may have been removed, or the link may be wrong."
              backTo={studentRoutes.missions}
              backLabel="Back to Missions"
            />
          )
        }
        const { mission, task, attempts, events } = data
        const completed = mission.status === 'completed'

        return (
          <>
            <BackLink to={studentRoutes.missions}>All missions</BackLink>
            <PageHeader title={mission.title} description={mission.whyItMatters} />

            <div className="task-meta">
              <Badge tone={completed ? 'success' : 'orange'}>{MISSION_STATUS_LABELS[mission.status]}</Badge>
              <Link to={studentRoutes.growthDimension(mission.dimension)} className="chip-link">
                {DIMENSION_LABELS[mission.dimension]}
              </Link>
            </div>

            <div className="mission-detail">
              <Card tone="softOrange" big>
                <Badge tone="orange">The small action</Badge>
                <p className="mission-detail__action">{mission.action}</p>
                <p className="note">{DIMENSION_DESCRIPTIONS[mission.dimension]}</p>
                {completed ? null : (
                  <Button to={studentRoutes.missionAttempt(mission.id)} variant="action" size="lg" arrow>
                    Record this action
                  </Button>
                )}
              </Card>

              {task && (
                <Card tone="softBlue">
                  <Badge tone="blue">From this academic task</Badge>
                  <h2 className="section-title">{task.title}</h2>
                  <p>{task.subject}</p>
                  <Button to={studentRoutes.task(task.id)} variant="light">Open Task</Button>
                </Card>
              )}

              {completed && attempts[0] && (
                <Card tone="success" big>
                  <Badge tone="success">✓ Action recorded</Badge>
                  <h2 className="section-title">What you did</h2>
                  <p>{attempts[0].note}</p>
                  <p className="note">Recorded {formatEventTime(attempts[0].createdAt)}</p>
                </Card>
              )}

              {events.length > 0 && (
                <Card>
                  <h2 className="section-title">Evidence from this mission</h2>
                  <EvidenceTimeline events={events} />
                </Card>
              )}
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
