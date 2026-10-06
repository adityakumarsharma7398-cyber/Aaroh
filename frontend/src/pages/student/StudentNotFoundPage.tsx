import NotFoundState from '../../components/layout/NotFoundState'
import { studentRoutes } from '../../config/routes'

export default function StudentNotFoundPage() {
  return (
    <NotFoundState
      title="That page doesn't exist"
      message="Check the link, or head back to your day."
      backTo={studentRoutes.today}
      backLabel="Back to Today"
    />
  )
}
