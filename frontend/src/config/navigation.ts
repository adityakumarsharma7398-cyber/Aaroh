import type { NavigationItem } from '../types/navigation'

export const STUDENT_NAV: NavigationItem[] = [
  { label: 'Today', path: '/student/today', icon: '◐' },
  { label: 'My Tasks', path: '/student/tasks', icon: '☰' },
  { label: 'Missions', path: '/student/missions', icon: '▲' },
  { label: 'My Growth', path: '/student/growth', icon: '↗' },
]

export const TEACHER_NAV: NavigationItem[] = [
  { label: 'Overview', path: '/teacher/overview', icon: '◐' },
  { label: 'Students', path: '/teacher/students', icon: '☺' },
  { label: 'Activities', path: '/teacher/activities', icon: '☰' },
  { label: 'Growth Signals', path: '/teacher/signals', icon: '↗' },
  { label: 'Evidence', path: '/teacher/evidence', icon: '✦' },
]
