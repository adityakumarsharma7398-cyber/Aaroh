import type { ReactNode } from 'react'

type Tone = 'blue' | 'yellow' | 'orange' | 'pink' | 'white'

export default function IconContainer({ tone = 'yellow', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`icon-box icon-box--${tone}`} aria-hidden="true">{children}</span>
}
