import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'

/** Abstract ascent mark: a rising chevron with a small sun above it. */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#F47B20" stroke="#111" strokeWidth="2" />
      <path d="M9 23 L16 12 L23 23" fill="none" stroke="#111" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 23 L16 12 L23 23" fill="none" stroke="#FFE94A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="6.8" r="2.4" fill="#FFE94A" stroke="#111" strokeWidth="1.4" />
    </svg>
  )
}

export default function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label={`${BRAND.name} home`}>
      <LogoMark className="logo__mark" />
      <span className="logo__word">{BRAND.name}</span>
    </Link>
  )
}
