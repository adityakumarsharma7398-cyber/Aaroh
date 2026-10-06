import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import GrowthTabs from '../../components/growth/GrowthTabs'
import Card from '../../components/ui/Card'
import { sortEvents } from '../../lib/evidence'
import { useEvidenceData } from './studentData'

export default function GrowthTimelinePage() {
  const state = useEvidenceData()

  return (
    <>
      <PageHeader
        title="Timeline"
        description="Your actions in the order they happened. No numbers, just what you did over time."
      />
      <GrowthTabs />

      <AsyncView state={state} loadingLabel="Loading your timeline…">
        {({ events, taskTitles }) => (
          <Card big>
            <EvidenceTimeline
              events={sortEvents(events, 'oldest')}
              taskTitles={taskTitles}
              grouped
              emptyText="Nothing on the timeline yet. It fills in as you work on tasks and missions."
            />
          </Card>
        )}
      </AsyncView>
    </>
  )
}
