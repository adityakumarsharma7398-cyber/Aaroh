import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import { NAV_LINKS } from './nav'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />
        <nav className="navbar__links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => `navlink${isActive ? ' is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="navbar__actions">
          <Button to="/login" variant="light">Login</Button>
          <Button to="/signup" variant="action">Get Started</Button>
        </div>
        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile">
          <div className="container mobile-menu__inner">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end className={({ isActive }) => `navlink navlink--block${isActive ? ' is-active' : ''}`}>
                {l.label}
              </NavLink>
            ))}
            <div className="mobile-menu__actions">
              <Button to="/login" variant="light">Login</Button>
              <Button to="/signup" variant="action">Get Started</Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
