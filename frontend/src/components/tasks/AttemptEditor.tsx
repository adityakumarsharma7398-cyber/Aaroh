import type { ReactNode } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TextArea from '../ui/TextArea'

type Props = {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  saving: boolean
  /** The text differs from the last saved attempt. */
  dirty: boolean
  /** Human-readable time of the last save in this session, if any. */
  savedAtLabel?: string
  error?: string
  /** Extra actions shown beside Save (e.g. Ask Mentor, Mark Task Complete). */
  actions?: ReactNode
}

/** The student's academic work area. Presentational: saving is handled by the page. */
export default function AttemptEditor({ value, onChange, onSave, saving, dirty, savedAtLabel, error, actions }: Props) {
  const empty = value.trim().length === 0
  return (
    <Card big className="attempt">
      <Badge tone="blue">Your work</Badge>
      <TextArea
        id="attempt"
        label="Your attempt"
        hint="Write your answer, code or working. Saving records that you made an attempt."
        value={value}
        onChange={onChange}
        rows={12}
        editor
        placeholder="Start here. It is fine if it is rough or incomplete."
      />
      <div className="attempt__actions">
        <Button variant="blue" onClick={onSave} disabled={saving || empty || !dirty}>
          {saving ? 'Saving…' : 'Save Attempt'}
        </Button>
        {actions}
      </div>
      <div className="attempt__status" role="status">
        {error && <p className="attempt__error">{error}</p>}
        {!error && savedAtLabel && !dirty && <p>Attempt saved at {savedAtLabel}. Recorded as an observable action.</p>}
        {!error && dirty && !empty && <p>You have unsaved changes. Save to record this attempt.</p>}
      </div>
    </Card>
  )
}
