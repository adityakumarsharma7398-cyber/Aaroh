import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceFlowExplainer from '../../components/evidence/EvidenceFlowExplainer'
import EvidenceTimeline from '../../components/evidence/EvidenceTimeline'
import GrowthTabs from '../../components/growth/GrowthTabs'
import Card from '../../components/ui/Card'
import { dimensionsByEvidence, sortEvents } from '../../lib/evidence'
import { useEvidenceData } from './studentData'

export default function GrowthEvidencePage() {
  const state = useEvidenceData()

  return (
    <>
      <PageHeader
        title="Evidence"
        description="The observable actions behind your signals. Each one is a record of what you did, not a score."
      />
      <GrowthTabs />
      <EvidenceFlowExplainer />

      <AsyncView state={state} loadingLabel="Loading your evidence…">
        {({ events, taskTitles, evidence }) => (
          <Card big>
            <h2 className="section-title">Recorded actions, newest first</h2>
            <EvidenceTimeline
              events={sortEvents(events, 'newest')}
              taskTitles={taskTitles}
              dimensionsByEvent={dimensionsByEvidence(evidence)}
              emptyText="No actions recorded yet. Evidence appears as you work on tasks and missions."
            />
          </Card>
        )}
      </AsyncView>
    </>
  )
}
