import { Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { TEACHER_NAV } from '../../config/navigation'

export default function TeacherLayout() {
  return (
    <AppShell navigation={TEACHER_NAV} areaLabel="Teacher">
      <Outlet />
    </AppShell>
  )
}
