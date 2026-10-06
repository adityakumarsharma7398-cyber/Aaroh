import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'action' | 'light' | 'blue' | 'yellow'
type Props = {
  variant?: Variant
  size?: 'md' | 'lg'
  arrow?: boolean
  children: ReactNode
  className?: string
} & ({ to: string } & Partial<ButtonHTMLAttributes<HTMLButtonElement>> | ({ to?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>))

export default function Button({ variant = 'light', size = 'md', arrow, children, className = '', ...rest }: Props) {
  const cls = `btn btn--${variant} btn--${size} ${className}`.trim()
  const content = (
    <>
      {children}
      {arrow && <span className="btn__arrow" aria-hidden="true">→</span>}
    </>
  )
  if ('to' in rest && rest.to) {
    return <Link to={rest.to} className={cls}>{content}</Link>
  }
  const { to: _to, ...buttonProps } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
  void _to
  return <button type="button" className={cls} {...buttonProps}>{content}</button>
}
