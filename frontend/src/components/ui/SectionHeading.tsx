import type { ReactNode } from 'react'
import Badge from './Badge'

type Props = {
  eyebrow?: string
  eyebrowTone?: 'blue' | 'yellow' | 'orange' | 'pink'
  title: ReactNode
  id?: string
  children?: ReactNode
  align?: 'left' | 'center'
}

export default function SectionHeading({ eyebrow, eyebrowTone = 'yellow', title, id, children, align = 'left' }: Props) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      {eyebrow && <Badge tone={eyebrowTone}>{eyebrow}</Badge>}
      <h2 id={id}>{title}</h2>
      {children && <p className="lead">{children}</p>}
    </div>
  )
}
