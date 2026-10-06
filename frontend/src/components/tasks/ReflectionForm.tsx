import { useState } from 'react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TextArea from '../ui/TextArea'
import type { ReflectionAnswer } from '../../types/domain'

type Props = {
  prompts: string[]
  onSubmit: (answers: ReflectionAnswer[]) => void
  submitting: boolean
  error?: string
}

/** Short reflection form. Holds only the text being typed; submitting is handled by the page. */
export default function ReflectionForm({ prompts, onSubmit, submitting, error }: Props) {
  const [responses, setResponses] = useState<string[]>(() => prompts.map(() => ''))
  const anyAnswer = responses.some((r) => r.trim().length > 0)

  return (
    <Card tone="softPink" big>
      <Badge tone="pink">Reflection</Badge>
      <p className="reflection__intro">Answer what is useful to you. One honest answer is enough.</p>
      <form
        className="reflection__form"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(prompts.map((prompt, i) => ({ prompt, response: responses[i] })))
        }}
      >
        {prompts.map((prompt, i) => (
          <TextArea
            key={prompt}
            id={`reflection-${i}`}
            label={prompt}
            value={responses[i]}
            rows={3}
            onChange={(value) => setResponses((prev) => prev.map((r, j) => (j === i ? value : r)))}
          />
        ))}
        <div className="reflection__actions">
          <Button type="submit" variant="action" disabled={submitting || !anyAnswer}>
            {submitting ? 'Saving…' : 'Save Reflection'}
          </Button>
        </div>
        {error && <p role="alert" className="attempt__error">{error}</p>}
      </form>
    </Card>
  )
}
