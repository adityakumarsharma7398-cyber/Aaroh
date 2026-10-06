import Button from '../ui/Button'
import Card from '../ui/Card'

type Props = { title: string; message: string; backTo: string; backLabel: string }

/** Shown inside the app shell when an id in the URL does not match anything. */
export default function NotFoundState({ title, message, backTo, backLabel }: Props) {
  return (
    <Card tone="softYellow" big className="notfound-state" role="alert">
      <h1>{title}</h1>
      <p>{message}</p>
      <Button to={backTo} variant="action">{backLabel}</Button>
    </Card>
  )
}
