import { useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TextArea from '../ui/TextArea'
import { DIMENSION_LABELS } from '../../content/labels'
import { DEVELOPMENT_DIMENSIONS, isDevelopmentDimension, type ObservationInput, type Student, type Task } from '../../types/domain'

type Props = {
  students: Student[]
  /** Tasks across the students shown; the form offers only the selected student's. */
  tasks: Task[]
  /** When set, the form is for this one student and hides the student picker. */
  fixedStudentId?: string
  onSubmit: (input: ObservationInput) => Promise<void>
}

/** Lightweight observation log. Holds only what is being typed; saving is done by the page via a service. */
export default function QuickLogForm({ students, tasks, fixedStudentId, onSubmit }: Props) {
  const [studentId, setStudentId] = useState(fixedStudentId ?? '')
  const [text, setText] = useState('')
  const [dimension, setDimension] = useState('')
  const [taskId, setTaskId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>()

  const effectiveStudent = fixedStudentId ?? studentId
  const studentTasks = tasks.filter((t) => t.studentId === effectiveStudent)
  const canSave = effectiveStudent !== '' && text.trim().length > 0 && !saving

  async function save() {
    setSaving(true)
    setMessage(undefined)
    try {
      await onSubmit({
        studentId: effectiveStudent,
        text,
        dimension: isDevelopmentDimension(dimension) ? dimension : undefined,
        taskId: taskId || undefined,
      })
      setText('')
      setDimension('')
      setTaskId('')
      setMessage({ kind: 'ok', text: 'Observation saved.' })
    } catch {
      setMessage({ kind: 'error', text: 'We could not save the observation. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card tone="softPink" className="quicklog">
      <Badge tone="pink">Quick log</Badge>
      <h2 className="section-title">Record an observation</h2>
      <p className="note">A short note about what you noticed. It is kept as your own context and is not scored.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        {fixedStudentId === undefined && (
          <label className="field">
            <span className="field__label">Student</span>
            <select
              className="field__select"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                setTaskId('')
              }}
            >
              <option value="">Choose a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        )}
        <TextArea
          id={`quicklog-text-${fixedStudentId ?? 'any'}`}
          label="Observation"
          value={text}
          onChange={setText}
          rows={4}
          placeholder="For example: persisted through the debugging task after the first attempt failed."
        />
        <div className="quicklog__row">
          <label className="field">
            <span className="field__label">Dimension (optional)</span>
            <select className="field__select" value={dimension} onChange={(e) => setDimension(e.target.value)}>
              <option value="">No specific dimension</option>
              {DEVELOPMENT_DIMENSIONS.map((d) => (
                <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Task (optional)</span>
            <select
              className="field__select"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={effectiveStudent === ''}
            >
              <option value="">No specific task</option>
              {studentTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" variant="action" disabled={!canSave}>
          {saving ? 'Saving…' : 'Save Observation'}
        </Button>
        <div role="status" className="quicklog__status">
          {message && <p className={message.kind === 'error' ? 'attempt__error' : ''}>{message.text}</p>}
        </div>
      </form>
    </Card>
  )
}
