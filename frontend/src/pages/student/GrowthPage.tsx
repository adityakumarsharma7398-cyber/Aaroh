import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import ActionEvidenceSignalFlow from '../../components/growth/ActionEvidenceSignalFlow'
import DimensionCard from '../../components/growth/DimensionCard'
import GrowthInsightCard from '../../components/growth/GrowthInsightCard'
import GrowthTabs from '../../components/growth/GrowthTabs'
import StudentGrowthCompass from '../../components/growth/StudentGrowthCompass'
import { studentRoutes } from '../../config/routes'
import { DEVELOPMENT_DIMENSIONS } from '../../types/domain'
import { useGrowthData } from './studentData'

export default function GrowthPage() {
  const state = useGrowthData()

  return (
    <>
      <PageHeader
        title="My Growth"
        description="Qualitative signals, each one backed by evidence. There is no overall numerical score, XP, or ranking."
      />
      <GrowthTabs />

      <AsyncView state={state} loadingLabel="Loading your growth…">
        {({ signals, insight }) => (
          <div className="growth-page-content" style={{ display: 'grid', gap: '28px' }}>
            {/* Visual 5-Dimension Growth Compass */}
            <StudentGrowthCompass signals={signals} />

            {/* Action -> Evidence -> Signal Pipeline Visual */}
            <ActionEvidenceSignalFlow />

            {/* Detailed Qualitative Dimension Cards */}
            <section aria-labelledby="dimension-cards-heading">
              <h2 id="dimension-cards-heading" className="subhead" style={{ marginBottom: '16px' }}>
                Observed Dimensions
              </h2>
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
            </section>

            {/* Qualitative Growth Pattern Insight */}
            {insight && <GrowthInsightCard insight={insight} />}

            <p className="note growth__disclaimer">
              Signals describe patterns in recent observable actions. They do not measure who you are, and they evolve as new evidence arrives.
            </p>
          </div>
        )}
      </AsyncView>
    </>
  )
}
