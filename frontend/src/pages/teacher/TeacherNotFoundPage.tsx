import NotFoundState from '../../components/layout/NotFoundState'
import { teacherRoutes } from '../../config/routes'

export default function TeacherNotFoundPage() {
  return (
    <NotFoundState
      title="That page doesn't exist"
      message="Check the link, or head back to the overview."
      backTo={teacherRoutes.overview}
      backLabel="Back to Overview"
    />
  )
}
