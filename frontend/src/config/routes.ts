// Route builders, so components never hand-write paths.
export const studentRoutes = {
  today: '/student/today',

  tasks: '/student/tasks',
  task: (taskId: string) => `/student/tasks/${taskId}`,
  taskMentor: (taskId: string) => `/student/tasks/${taskId}/mentor`,
  taskComplete: (taskId: string) => `/student/tasks/${taskId}/complete`,
  reflection: (taskId: string) => `/student/reflection/${taskId}`,

  missions: '/student/missions',
  mission: (missionId: string) => `/student/missions/${missionId}`,
  missionAttempt: (missionId: string) => `/student/missions/${missionId}/attempt`,

  growth: '/student/growth',
  growthEvidence: '/student/growth/evidence',
  growthTimeline: '/student/growth/timeline',
  growthDimension: (dimension: string) => `/student/growth/${dimension}`,
}

export interface TeacherEvidenceQuery {
  student?: string
  activity?: string
  dimension?: string
  type?: string
}

export const teacherRoutes = {
  overview: '/teacher/overview',
  students: '/teacher/students',
  student: (studentId: string) => `/teacher/students/${studentId}`,
  activities: '/teacher/activities',
  signals: '/teacher/signals',
  /** Growth Signals with one dimension selected. */
  signal: (dimension: string) => `/teacher/signals?dimension=${dimension}`,
  /** Evidence, optionally pre-filtered. Filters live in the URL so they can be linked to. */
  evidence: (query: TeacherEvidenceQuery = {}) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value)
    const qs = params.toString()
    return qs ? `/teacher/evidence?${qs}` : '/teacher/evidence'
  },
}
