import { NavLink } from 'react-router-dom'
import type { NavigationItem } from '../../types/navigation'

export default function AppNav({ items, label }: { items: NavigationItem[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ul className="appnav">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink to={item.path} className={({ isActive }) => `appnav__link${isActive ? ' is-active' : ''}`}>
              <span className="appnav__icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
