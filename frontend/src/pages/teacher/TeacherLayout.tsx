import { Link, Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Badge from '../../components/ui/Badge'
import { TEACHER_NAV } from '../../config/navigation'

export default function TeacherLayout() {
  return (
    <AppShell
      navigation={TEACHER_NAV}
      areaLabel="Teacher Demo"
      utilities={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge tone="yellow">Verified Demo • Dr. Sarah Adams</Badge>
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
