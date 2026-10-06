import { Link } from 'react-router-dom'
import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import ActivitySummary from '../../components/teacher/ActivitySummary'
import AttentionList from '../../components/teacher/AttentionList'
import EvidenceFeed from '../../components/teacher/EvidenceFeed'
import GroupSignalSummary from '../../components/teacher/GroupSignalSummary'
import QuickLogForm from '../../components/teacher/QuickLogForm'
import { teacherRoutes } from '../../config/routes'
import { buildFeed, summariseActivity } from '../../lib/teacher'
import { teacherObservationService } from '../../services/teacherObservationService'
import type { ObservationInput } from '../../types/domain'
import { useOverviewData } from './teacherData'

export default function OverviewPage() {
  const state = useOverviewData()

  async function logObservation(input: ObservationInput) {
    await teacherObservationService.createObservation(input)
    state.reload()
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description="Academic progress and observable development patterns across your students. A place to start conversations, not to score anyone."
      />
      <AsyncView state={state} loadingLabel="Loading the overview…">
        {(d) => {
          const feed = buildFeed(d.events, d.observations, d.signals).slice(0, 6)
          return (
            <>
              <ActivitySummary summary={summariseActivity(d.students, d.tasks, d.events)} />

              <div className="t-overview">
                <div className="t-overview__attn">
                  <AttentionList notes={d.notes} studentNames={d.studentNames} />
                </div>
                <div className="t-overview__dev">
                  <GroupSignalSummary signals={d.groupSignals} />
                </div>
                <div className="t-overview__evidence">
                  <Card className="t-evidence">
                    <h2 className="section-title">Recent evidence</h2>
                    <p className="note">Observable actions, newest first. Each is a record of what happened.</p>
                    <EvidenceFeed
                      items={feed}
                      pageSize={6}
                      studentNames={d.studentNames}
                      taskTitles={d.taskTitles}
                    />
                    <Link to={teacherRoutes.evidence()} className="text-link">See all evidence</Link>
                  </Card>
                </div>
                <div className="t-overview__log">
                  <QuickLogForm students={d.students} tasks={d.tasks} onSubmit={logObservation} />
                </div>
              </div>
            </>
          )
        }}
      </AsyncView>
    </>
  )
}
