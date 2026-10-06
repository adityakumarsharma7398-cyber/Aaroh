import { LogoMark } from '../ui/Logo'
import Card from '../ui/Card'
import { BRAND } from '../../config/brand'
import { COMPASS_DIMENSIONS, HERO_CARDS } from '../../content/landing'

// Geometry works in a 100 x 100 box with the compass centre at (50, 50).
const CENTER = 50
const polar = (radius: number, degrees: number) => {
  const a = (degrees * Math.PI) / 180
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) }
}

const NODE_RADIUS = 38
const TICKS = Array.from({ length: 48 }, (_, i) => i * 7.5)
const SPARKLES: [number, number, number][] = [[8, 60, 1], [93, 62, 0.9], [50, 95.5, 0.8], [30, 24, 0.7], [71, 24, 0.8]]

const sparkle = (x: number, y: number, s: number) =>
  `M${x} ${y - 1.7 * s}L${x + 0.5 * s} ${y - 0.5 * s}L${x + 1.7 * s} ${y}L${x + 0.5 * s} ${y + 0.5 * s}L${x} ${y + 1.7 * s}L${x - 0.5 * s} ${y + 0.5 * s}L${x - 1.7 * s} ${y}L${x - 0.5 * s} ${y - 0.5 * s}Z`

/**
 * The hero visual. Five directions of growth around a central AAROH core, drawn as a compass bezel
 * with curved connectors, plus three small floating cards. It is deliberately not a process diagram:
 * nothing here is ordered, scored or connected card-to-card.
 */
export default function GrowthCompass() {
  return (
    <div
      className="aaroh"
      role="img"
      aria-label="Aaroh growth compass: five directions of growth around the centre, which are self-reliance, perseverance, sustained engagement, problem-solving and initiative. Examples around it: try once before asking for a hint; attempted, got stuck, tried again; your actions are creating evidence."
    >
      <Card big className="compass-card">
        <div className="compass">
          <svg className="compass__svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="compass__ring" cx={CENTER} cy={CENTER} r="38" />
            <circle className="compass__ring compass__ring--inner" cx={CENTER} cy={CENTER} r="27" />
            {TICKS.map((deg, i) => {
              const cardinal = i % 12 === 0
              const from = polar(cardinal ? 43.5 : 44.5, deg)
              const to = polar(cardinal ? 47.5 : 46.5, deg)
              return <line key={deg} className={`compass__tick${cardinal ? ' compass__tick--major' : ''}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            })}
            {SPARKLES.map(([x, y, s]) => (
              <path key={`${x}-${y}`} className="compass__sparkle" d={sparkle(x, y, s)} />
            ))}
            {COMPASS_DIMENSIONS.map((d, i) => {
              const start = polar(19.5, d.angle)
              const control = polar(27, d.angle + 26)
              const end = polar(31, d.angle)
              return (
                <g key={d.label} style={{ animationDelay: `${0.3 + i * 0.09}s` }} className="compass__link">
                  <path className="compass__path" pathLength="1" d={`M${start.x} ${start.y}Q${control.x} ${control.y} ${end.x} ${end.y}`} />
                  <circle className={`compass__end dot--${d.tone}`} cx={end.x} cy={end.y} r="1.5" />
                </g>
              )
            })}
          </svg>

          <div className="compass__core">
            <LogoMark className="compass__mark" />
            <span className="compass__name">{BRAND.name}</span>
            <span className="compass__sub">Grow through action</span>
          </div>

          {COMPASS_DIMENSIONS.map((d, i) => {
            const at = polar(NODE_RADIUS, d.angle)
            return (
              <span
                key={d.label}
                className="compass__node"
                style={{ left: `${at.x}%`, top: `${at.y}%`, animationDelay: `${0.45 + i * 0.09}s` }}
              >
                <span className={`compass__dot dot--${d.tone}`} />
                <span className="compass__label">{d.label}</span>
              </span>
            )
          })}
        </div>

        <ul className="compass__legend">
          {COMPASS_DIMENSIONS.map((d) => (
            <li key={d.label}>
              <span className={`compass__dot dot--${d.tone}`} />
              {d.label}
            </li>
          ))}
        </ul>
      </Card>

      {HERO_CARDS.map((c, i) => (
        <Card key={c.tag} tone={c.tone} className={`aaroh__card aaroh__card--${i + 1}`}>
          <small>{c.tag}</small>
          <strong>{c.text}</strong>
        </Card>
      ))}
    </div>
  )
}
