import type { ChangeEvent } from 'react'
import Button from '../ui/Button'
import { DIMENSION_LABELS, EVIDENCE_KIND_LABELS, type EvidenceKind } from '../../content/labels'
import { NO_FEED_FILTERS, type FeedFilters } from '../../lib/teacher'
import { DEVELOPMENT_DIMENSIONS, type Activity, type Student } from '../../types/domain'

type Props = {
  filters: FeedFilters
  onChange: (next: FeedFilters) => void
  students: Student[]
  activities: Activity[]
}

const KINDS = Object.keys(EVIDENCE_KIND_LABELS) as EvidenceKind[]

export default function EvidenceFilters({ filters, onChange, students, activities }: Props) {
  const set = (key: keyof FeedFilters) => (e: ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })
  const active = Object.values(filters).some(Boolean)

  return (
    <div className="evfilters">
      <label className="field">
        <span className="field__label">Student</span>
        <select className="field__select" value={filters.student} onChange={set('student')}>
          <option value="">All students</option>
          {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Activity</span>
        <select className="field__select" value={filters.activity} onChange={set('activity')}>
          <option value="">All activities</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Development dimension</span>
        <select className="field__select" value={filters.dimension} onChange={set('dimension')}>
          <option value="">All dimensions</option>
          {DEVELOPMENT_DIMENSIONS.map((d) => (
            <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Event type</span>
        <select className="field__select" value={filters.type} onChange={set('type')}>
          <option value="">All types</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>{EVIDENCE_KIND_LABELS[k]}</option>
          ))}
        </select>
      </label>
      {active && (
        <div className="evfilters__clear">
          <Button variant="light" onClick={() => onChange(NO_FEED_FILTERS)}>Clear filters</Button>
        </div>
      )}
    </div>
  )
}
