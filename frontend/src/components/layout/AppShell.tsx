import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Badge from '../ui/Badge'
import Logo from '../ui/Logo'
import AppNav from './AppNav'
import type { NavigationItem } from '../../types/navigation'

type Props = {
  /** Navigation entries; the shell does not know which application it hosts. */
  navigation: NavigationItem[]
  /** Short name of the area, e.g. "Student". Used for the nav label and top bar. */
  areaLabel: string
  /** Slot for profile / notification controls (rendered at the right of the top bar). */
  utilities?: ReactNode
  children: ReactNode
}

export default function AppShell({ navigation, areaLabel, utilities, children }: Props) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const navLabel = `${areaLabel} navigation`

  return (
    <div className="app">
      <a href="#app-main" className="skip-link">Skip to content</a>
      <aside className="app__sidebar">
        <Logo />
        <AppNav items={navigation} label={navLabel} />
      </aside>

      <div className="app__body">
        <header className="app__topbar">
          <button
            type="button"
            className="navbar__toggle app__toggle"
            aria-expanded={open}
            aria-controls="app-mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
          <div className="app__topbar-logo"><Logo /></div>
          <Badge tone="yellow" className="app__area">{areaLabel}</Badge>
          <div className="app__utilities">{utilities}</div>
        </header>

        {open && (
          <div id="app-mobile-nav" className="app__mobile-nav">
            <AppNav items={navigation} label={navLabel} />
          </div>
        )}

        <main id="app-main" className="app__content">{children}</main>
      </div>
    </div>
  )
}
