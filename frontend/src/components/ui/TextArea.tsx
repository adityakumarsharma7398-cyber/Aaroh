type Props = {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
  /** Editor-like monospace look for work areas. */
  editor?: boolean
}

export default function TextArea({ id, label, hint, value, onChange, rows = 5, placeholder, disabled, editor }: Props) {
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      {hint && <p id={hintId} className="field__hint">{hint}</p>}
      <textarea
        id={id}
        className={`field__input${editor ? ' field__input--editor' : ''}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hintId}
        spellCheck={!editor}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
