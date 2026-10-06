import { TASK_STATUS_FILTERS } from '../../content/labels'
import type { StatusFilter, SubjectFilter } from '../../lib/tasks'

type Props = {
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  subject: SubjectFilter
  onSubjectChange: (value: SubjectFilter) => void
  subjects: string[]
  /** Number of tasks per status filter, for the labels. */
  counts: Record<StatusFilter, number>
}

export default function TaskFilters({ status, onStatusChange, subject, onSubjectChange, subjects, counts }: Props) {
  return (
    <div className="filters">
      <div className="filters__group" role="group" aria-label="Filter by status">
        {TASK_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-chip${status === f.value ? ' is-active' : ''}`}
            aria-pressed={status === f.value}
            onClick={() => onStatusChange(f.value)}
          >
            {f.label} <span className="filter-chip__count">{counts[f.value]}</span>
          </button>
        ))}
      </div>
      {subjects.length > 1 && (
        <label className="filters__subject">
          <span>Subject</span>
          <select value={subject} onChange={(e) => onSubjectChange(e.target.value)}>
            <option value="all">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
