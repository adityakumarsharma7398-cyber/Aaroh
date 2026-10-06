import { Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { STUDENT_NAV } from '../../config/navigation'

export default function StudentLayout() {
  return (
    <AppShell navigation={STUDENT_NAV} areaLabel="Student">
      <Outlet />
    </AppShell>
  )
}
