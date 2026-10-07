import { Link, Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Badge from '../../components/ui/Badge'
import { STUDENT_NAV } from '../../config/navigation'

export default function StudentLayout() {
  return (
    <AppShell
      navigation={STUDENT_NAV}
      areaLabel="Student Demo"
      utilities={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge tone="blue">Verified Demo • Maya Chen</Badge>
          <Link to="/demo" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--black)', textDecoration: 'underline' }}>
            Switch
          </Link>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  )
}
