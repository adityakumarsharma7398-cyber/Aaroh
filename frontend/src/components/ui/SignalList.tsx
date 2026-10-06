import Badge from './Badge'

export interface SignalItem {
  label: string
  trend: 'Improving' | 'Stable' | 'Emerging' | 'Needs attention' | 'Not enough evidence yet'
}

const TREND_UI = {
  Improving: { tone: 'success', glyph: '↗ ' },
  Stable: { tone: 'info', glyph: '→ ' },
  Emerging: { tone: 'yellow', glyph: '◔ ' },
  'Needs attention': { tone: 'warning', glyph: '' },
  'Not enough evidence yet': { tone: 'white', glyph: '' },
} as const

export function SignalBadge({ trend }: { trend: SignalItem['trend'] }) {
  return <Badge tone={TREND_UI[trend].tone}>{TREND_UI[trend].glyph}{trend}</Badge>
}

export default function SignalList({ signals }: { signals: SignalItem[] }) {
  return (
    <ul className="signals">
      {signals.map((s) => (
        <li key={s.label}>
          <span>{s.label}</span>
          <SignalBadge trend={s.trend} />
        </li>
      ))}
    </ul>
  )
}
