import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'
import Logo from '../ui/Logo'
import { NAV_LINKS } from './nav'

export default function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Logo />
          <p className="footer__tag">{BRAND.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="footer__links">
            {[...NAV_LINKS, { to: '/login', label: 'Login' }].map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container footer__legal">© {new Date().getFullYear()} {BRAND.name}. Built for hackathon demonstration.</div>
    </footer>
  )
}
