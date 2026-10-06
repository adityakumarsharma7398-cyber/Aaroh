import type { ReactNode } from 'react'

type Tone = 'blue' | 'yellow' | 'orange' | 'pink' | 'white' | 'success' | 'info' | 'warning'

export default function Badge({ tone = 'white', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`badge badge--${tone} ${className}`.trim()}>{children}</span>
}
