import { useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TextArea from '../ui/TextArea'
import { DIMENSION_LABELS } from '../../content/labels'
import { DEVELOPMENT_DIMENSIONS, type ActivityInput, type DevelopmentDimension } from '../../types/domain'

type Props = {
  onSubmit: (input: ActivityInput) => Promise<void>
  onCancel: () => void
}

/** Simple activity creation. Saving and assigning to students are handled by the backend later. */
export default function ActivityForm({ onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState('30')
  const [dimensions, setDimensions] = useState<DevelopmentDimension[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const toggle = (d: DevelopmentDimension) =>
    setDimensions((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  async function save() {
    setSaving(true)
    setError(undefined)
    try {
      await onSubmit({ title, subject, description, estimatedMinutes: Number(minutes), dimensions })
    } catch {
      setError('We could not create the activity. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Card tone="softBlue" big className="activity-form">
      <Badge tone="blue">New activity</Badge>
      <p className="note">Describe ordinary academic work, and tag the development opportunities it naturally offers.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className="quicklog__row">
          <label className="field">
            <span className="field__label">Title</span>
            <input className="field__select" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Subject</span>
            <input className="field__select" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
        </div>
        <TextArea id="activity-description" label="Description" value={description} onChange={setDescription} rows={3} />
        <label className="field activity-form__minutes">
          <span className="field__label">Estimated effort (minutes)</span>
          <input
            className="field__select"
            type="number"
            min={5}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <fieldset className="activity-form__dims">
          <legend className="field__label">Development opportunities</legend>
          {DEVELOPMENT_DIMENSIONS.map((d) => (
            <label key={d} className="check">
              <input type="checkbox" checked={dimensions.includes(d)} onChange={() => toggle(d)} />
              <span>{DIMENSION_LABELS[d]}</span>
            </label>
          ))}
        </fieldset>
        <div className="activity-form__actions">
          <Button type="submit" variant="action" disabled={saving || title.trim().length === 0}>
            {saving ? 'Creating…' : 'Create activity'}
          </Button>
          <Button variant="light" onClick={onCancel} disabled={saving}>Cancel</Button>
        </div>
        {error && <p role="alert" className="attempt__error">{error}</p>}
      </form>
    </Card>
  )
}
