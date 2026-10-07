import Card from '../ui/Card'
import { describeError } from '../../lib/errors'

/** Shown when a page cannot load its data. The wording depends on what failed (sign-in, access, connection...). */
export default function ErrorNotice({ error }: { error: unknown }) {
  const { title, message } = describeError(error)
  return (
    <Card tone="softOrange" role="alert" className="error-notice">
      <h2 className="section-title">{title}</h2>
      <p>{message}</p>
    </Card>
  )
}
