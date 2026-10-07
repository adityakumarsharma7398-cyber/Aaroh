import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import { LogoMark } from '../ui/Logo'
import { BRAND } from '../../config/brand'
import { studentRoutes } from '../../config/routes'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import type { DevelopmentDimension, DevelopmentSignal } from '../../types/domain'

// 5 Dimensions arranged around center at (50, 50)
const CENTER = 50
const polar = (radius: number, degrees: number) => {
  const a = (degrees * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) }
}

interface DimensionConfig {
  key: DevelopmentDimension
  label: string
  angle: number
  tone: 'coral' | 'yellow' | 'blue' | 'white' | 'dark'
}

const COMPASS_NODES: DimensionConfig[] = [
  { key: 'perseverance', label: 'Perseverance', angle: -90, tone: 'coral' },
  { key: 'initiative', label: 'Initiative', angle: -18, tone: 'yellow' },
  { key: 'sustained-engagement', label: 'Sustained Engagement', angle: 54, tone: 'blue' },
  { key: 'self-reliance', label: 'Self-Reliance', angle: 126, tone: 'coral' },
  { key: 'problem-solving', label: 'Problem-Solving', angle: 198, tone: 'blue' },
]

interface Props {
  signals?: DevelopmentSignal[]
  compact?: boolean
}

export default function StudentGrowthCompass({ signals = [], compact = false }: Props) {
  return (
    <Card big={!compact} tone="white" className={`growth-compass-card ${compact ? 'growth-compass-card--compact' : ''}`}>
      <div className="growth-compass-header">
        <div>
          <span className="growth-compass-badge">Evidence-Grounded Compass</span>
          <h3 className="growth-compass-title">Development Compass</h3>
        </div>
        <Link to={studentRoutes.growth} className="growth-compass-link">
          All Signals →
        </Link>
      </div>

      <div className="growth-compass-canvas" role="img" aria-label="AAROH 5-Dimension Growth Compass">
        <svg className="growth-compass-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="compass-svg__ring" cx={CENTER} cy={CENTER} r="38" />
          <circle className="compass-svg__ring compass-svg__ring--inner" cx={CENTER} cy={CENTER} r="22" />

          {/* Connectors from center to dimension nodes */}
          {COMPASS_NODES.map((node) => {
            const start = polar(18, node.angle)
            const end = polar(36, node.angle)
            return (
              <line
                key={node.key}
                className="compass-svg__spoke"
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
              />
            )
          })}
        </svg>

        {/* Central Core */}
        <div className="growth-compass-core">
          <LogoMark className="growth-compass-core__logo" />
          <span className="growth-compass-core__brand">{BRAND.name}</span>
          <span className="growth-compass-core__sub">Growth Layer</span>
        </div>

        {/* Outer Interactive Nodes */}
        {COMPASS_NODES.map((node) => {
          const at = polar(38, node.angle)
          const signal = signals.find((s) => s.dimension === node.key)
          const trendText = signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Emerging'
          const count = signal?.evidenceEventIds?.length ?? 0

          return (
            <Link
              key={node.key}
              to={studentRoutes.growthDimension(node.key)}
              className={`growth-compass-node growth-compass-node--${node.tone}`}
              style={{ left: `${at.x}%`, top: `${at.y}%` }}
              title={`${node.label}: ${trendText} (${count} actions)`}
            >
              <div className="growth-compass-node__inner">
                <span className="growth-compass-node__label">{node.label}</span>
                <span className="growth-compass-node__status">{trendText}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="growth-compass-legend">
        {COMPASS_NODES.map((node) => {
          const signal = signals.find((s) => s.dimension === node.key)
          const trendLabel = signal ? SIGNAL_TREND_LABELS[signal.trend] : 'Observing'
          return (
            <Link
              key={node.key}
              to={studentRoutes.growthDimension(node.key)}
              className="growth-compass-legend__item"
            >
              <span className={`growth-compass-legend__dot growth-compass-legend__dot--${node.tone}`} />
              <span className="growth-compass-legend__name">{DIMENSION_LABELS[node.key]}:</span>
              <strong className="growth-compass-legend__val">{trendLabel}</strong>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
