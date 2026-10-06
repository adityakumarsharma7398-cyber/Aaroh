import type { ReactNode } from 'react'

type Props = { title: string; description?: string; actions?: ReactNode }

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="lead">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}
