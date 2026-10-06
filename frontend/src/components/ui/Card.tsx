import type { HTMLAttributes } from 'react'

type Tone =
  | 'white'
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'pink'
  | 'success'
  | 'softBlue'
  | 'softYellow'
  | 'softOrange'
  | 'softPink'
type Props = HTMLAttributes<HTMLDivElement> & { tone?: Tone; big?: boolean; lift?: boolean }

export default function Card({ tone = 'white', big, lift, className = '', ...rest }: Props) {
  const cls = ['card', `card--${tone}`, big && 'card--big', lift && 'card--lift', className].filter(Boolean).join(' ')
  return <div className={cls} {...rest} />
}
