import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/public/PublicLayout'
import LandingPage from './pages/public/LandingPage'
import NotFound from './pages/public/NotFound'
import StudentLayout from './pages/student/StudentLayout'
import TodayPage from './pages/student/TodayPage'
import TasksPage from './pages/student/TasksPage'
import TaskDetailPage from './pages/student/TaskDetailPage'
import TaskMentorPage from './pages/student/TaskMentorPage'
import TaskCompletePage from './pages/student/TaskCompletePage'
import ReflectionPage from './pages/student/ReflectionPage'
import MissionsPage from './pages/student/MissionsPage'
import MissionDetailPage from './pages/student/MissionDetailPage'
import MissionAttemptPage from './pages/student/MissionAttemptPage'
import GrowthPage from './pages/student/GrowthPage'
import GrowthEvidencePage from './pages/student/GrowthEvidencePage'
import GrowthTimelinePage from './pages/student/GrowthTimelinePage'
import DimensionDetailPage from './pages/student/DimensionDetailPage'
import StudentNotFoundPage from './pages/student/StudentNotFoundPage'
import TeacherLayout from './pages/teacher/TeacherLayout'
import OverviewPage from './pages/teacher/OverviewPage'
import StudentsPage from './pages/teacher/StudentsPage'
import StudentDetailPage from './pages/teacher/StudentDetailPage'
import TeacherNotFoundPage from './pages/teacher/TeacherNotFoundPage'
import ActivitiesPage from './pages/teacher/ActivitiesPage'
import SignalsPage from './pages/teacher/SignalsPage'
import EvidencePage from './pages/teacher/EvidencePage'

import DemoEntryPage from './pages/public/DemoEntryPage'

// Public routes live inside PublicLayout. /login, /signup and /demo route into DemoEntryPage.
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/how-it-works" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/login" element={<DemoEntryPage />} />
        <Route path="/signup" element={<DemoEntryPage />} />
        <Route path="/demo" element={<DemoEntryPage />} />
      </Route>

      <Route path="/today" element={<Navigate to="/student/today" replace />} />
      <Route path="/tasks" element={<Navigate to="/student/tasks" replace />} />
      <Route path="/growth" element={<Navigate to="/student/growth" replace />} />

      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<TodayPage />} />

        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="tasks/:taskId/mentor" element={<TaskMentorPage />} />
        <Route path="tasks/:taskId/complete" element={<TaskCompletePage />} />
        <Route path="reflection/:taskId" element={<ReflectionPage />} />

        <Route path="missions" element={<MissionsPage />} />
        <Route path="missions/:missionId" element={<MissionDetailPage />} />
        <Route path="missions/:missionId/attempt" element={<MissionAttemptPage />} />

        <Route path="growth" element={<GrowthPage />} />
        <Route path="growth/evidence" element={<GrowthEvidencePage />} />
        <Route path="growth/timeline" element={<GrowthTimelinePage />} />
        <Route path="growth/:dimension" element={<DimensionDetailPage />} />

        <Route path="*" element={<StudentNotFoundPage />} />
      </Route>

      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />
        <Route path="students/detail/:id" element={<StudentDetailPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="signals" element={<SignalsPage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="*" element={<TeacherNotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
