import Button from '../../components/ui/Button'
import { BRAND } from '../../config/brand'

export default function NotFound() {
  return (
    <section className="section">
      <div className="container notfound">
        <h1>This page isn&apos;t ready yet.</h1>
        <p className="lead">We&apos;re still building this part of {BRAND.shortName}.</p>
        <Button to="/" variant="action" arrow>Back to Home</Button>
      </div>
    </section>
  )
}
