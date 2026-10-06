import { NavLink } from 'react-router-dom'
import { studentRoutes } from '../../config/routes'

const TABS = [
  { to: studentRoutes.growth, label: 'Overview' },
  { to: studentRoutes.growthEvidence, label: 'Evidence' },
  { to: studentRoutes.growthTimeline, label: 'Timeline' },
]

export default function GrowthTabs() {
  return (
    <nav aria-label="Growth sections" className="tabs">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end className={({ isActive }) => `tabs__link${isActive ? ' is-active' : ''}`}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
