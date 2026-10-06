import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceFlowExplainer from '../../components/evidence/EvidenceFlowExplainer'
import DimensionCard from '../../components/growth/DimensionCard'
import GrowthInsightCard from '../../components/growth/GrowthInsightCard'
import GrowthTabs from '../../components/growth/GrowthTabs'
import { studentRoutes } from '../../config/routes'
import { DEVELOPMENT_DIMENSIONS } from '../../types/domain'
import { useGrowthData } from './studentData'

export default function GrowthPage() {
  const state = useGrowthData()

  return (
    <>
      <PageHeader
        title="My Growth"
        description="Qualitative signals, each one backed by evidence. There is no overall score."
      />
      <GrowthTabs />
      <EvidenceFlowExplainer />

      <AsyncView state={state} loadingLabel="Loading your growth…">
        {({ signals, insight }) => (
          <>
            <ul className="dim-grid">
              {DEVELOPMENT_DIMENSIONS.map((dimension) => (
                <li key={dimension}>
                  <DimensionCard
                    dimension={dimension}
                    signal={signals.find((s) => s.dimension === dimension)}
                    to={studentRoutes.growthDimension(dimension)}
                  />
                </li>
              ))}
            </ul>
            {insight && <GrowthInsightCard insight={insight} />}
            <p className="note growth__disclaimer">
              Signals describe patterns in recent actions. They do not measure who you are, and they can change as new
              evidence arrives.
            </p>
          </>
        )}
      </AsyncView>
    </>
  )
}
