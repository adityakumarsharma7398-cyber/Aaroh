import ErrorNotice from '../../components/layout/ErrorNotice'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import DevelopmentOpportunities from '../../components/growth/DevelopmentOpportunities'
import StudentGrowthCompass from '../../components/growth/StudentGrowthCompass'
import GrowthInsightCard from '../../components/growth/GrowthInsightCard'
import MissionCard from '../../components/missions/MissionCard'
import TaskSummaryCard from '../../components/tasks/TaskSummaryCard'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { studentRoutes } from '../../config/routes'
import { firstName, formatLongDate, getGreeting } from '../../lib/format'
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
        description="Here is your active academic work and development opportunities for today."
        actions={<Badge tone="white">{formatLongDate()}</Badge>}
      />
      <div className="today">
        {/* Academic Task Focus */}
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

        {/* Development Opportunities */}
        {task && task.opportunities.length > 0 && (
          <div className="today__opp">
            <DevelopmentOpportunities opportunities={task.opportunities} />
          </div>
        )}

        {/* Socratic Mentor Teaser */}
        {task && (
          <div className="today__mentor-teaser">
            <Card tone="softYellow" big>
              <div className="today-mentor__header">
                <Badge tone="yellow">Socratic AI Mentor</Badge>
                <span className="today-mentor__badge">Server Controlled Ladder</span>
              </div>
              <h3 className="section-title">AAROH Mentor</h3>
              <blockquote className="today-mentor__quote">
                &ldquo;I won&apos;t solve the problem for you. I&apos;ll help you think through it.&rdquo;
              </blockquote>
              <p className="note">
                Stuck on your mathematical challenge? Request hint progression calibrated to your actual attempts.
              </p>
              <div className="today-mentor__actions">
                <Button to={studentRoutes.taskMentor(task.id)} variant="action" arrow>
                  Open Mentor →
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Growth Mission */}
        {mission && (
          <div className="today__mission">
            <MissionCard mission={mission} to={studentRoutes.mission(mission.id)} />
          </div>
        )}

        {/* Visual 5-Dimension Growth Compass */}
        <div className="today__snapshot">
          <StudentGrowthCompass signals={signals} />
        </div>

        {/* Observable Action Timeline */}
        <div className="today__evidence">
          <EvidenceTimeline
            events={events}
            taskTitles={task ? { [task.id]: task.title } : {}}
            title="Recent Observable Actions"
            limit={6}
          />
        </div>

        {/* Qualitative Growth Insight */}
        {insight && (
          <div className="today__insight">
            <GrowthInsightCard insight={insight} />
          </div>
        )}
      </div>
    </>
  )
}
