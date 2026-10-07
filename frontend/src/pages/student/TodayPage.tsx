import ErrorNotice from '../../components/layout/ErrorNotice'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceList from '../../components/evidence/EvidenceList'
import DevelopmentOpportunities from '../../components/growth/DevelopmentOpportunities'
import DevelopmentSnapshot from '../../components/growth/DevelopmentSnapshot'
import GrowthInsightCard from '../../components/growth/GrowthInsightCard'
import MissionCard from '../../components/missions/MissionCard'
import TaskSummaryCard from '../../components/tasks/TaskSummaryCard'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { firstName, formatLongDate, getGreeting } from '../../lib/format'
import { DEVELOPMENT_DIMENSIONS } from '../../types/domain'
import { useTodayData } from './useTodayData'

export default function TodayPage() {
  const state = useTodayData()

  if (state.status === 'loading') {
    return (
      <>
        <PageHeader title="Today" />
        <p role="status" className="note">Loading your day…</p>
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <>
        <PageHeader title="Today" />
        <ErrorNotice error={state.error} />
      </>
    )
  }

  const { student, task, mission, events, signals, insight } = state.data

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${firstName(student.name)}.`}
        description="Here's what you can work on today."
        actions={<Badge tone="white">{formatLongDate()}</Badge>}
      />
      <div className="today">
        <div className="today__task">
          {task ? (
            <TaskSummaryCard task={task} to={studentRoutes.task(task.id)} />
          ) : (
            <Card big>
              <h2 className="section-title">Nothing is assigned right now</h2>
              <p>When new academic work arrives, it will show up here.</p>
            </Card>
          )}
        </div>
        {task && (
          <div className="today__opp">
            <DevelopmentOpportunities opportunities={task.opportunities} />
          </div>
        )}
        {mission && (
          <div className="today__mission">
            <MissionCard mission={mission} to={studentRoutes.mission(mission.id)} />
          </div>
        )}
        <div className="today__evidence"><EvidenceList events={events} /></div>
        <div className="today__snapshot">
          <DevelopmentSnapshot
            dimensions={task && task.opportunities.length > 0 ? task.opportunities.map((o) => o.dimension) : [...DEVELOPMENT_DIMENSIONS]}
            signals={signals}
          />
        </div>
        {insight && <div className="today__insight"><GrowthInsightCard insight={insight} /></div>}
      </div>
    </>
  )
}
