import { Link } from 'react-router-dom'

export default function BackLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="backlink">
      <span aria-hidden="true">←</span> {children}
    </Link>
  )
}
