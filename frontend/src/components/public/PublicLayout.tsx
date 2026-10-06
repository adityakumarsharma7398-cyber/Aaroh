import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import { BRAND } from '../../config/brand'

export default function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    document.title = `${BRAND.name} — ${BRAND.pageTitle}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', BRAND.description)
  }, [])
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PublicNavbar />
      <main id="main">
        <Outlet />
      </main>
      <PublicFooter />
    </>
  )
}
