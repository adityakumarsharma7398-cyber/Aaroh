import type { StudentShow } from '../../lib/teacher'

const OPTIONS: { value: StudentShow; label: string }[] = [
  { value: 'all', label: 'All students' },
  { value: 'in-progress', label: 'Work in progress' },
  { value: 'flagged', label: 'Flagged for a closer look' },
]

type Props = {
  query: string
  onQueryChange: (value: string) => void
  show: StudentShow
  onShowChange: (value: StudentShow) => void
  counts: Record<StudentShow, number>
}

export default function StudentFilters({ query, onQueryChange, show, onShowChange, counts }: Props) {
  return (
    <div className="filters">
      <label className="search">
        <span>Search by name</span>
        <input type="search" value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Type a name" />
      </label>
      <div className="filters__group" role="group" aria-label="Show students">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`filter-chip${show === o.value ? ' is-active' : ''}`}
            aria-pressed={show === o.value}
            onClick={() => onShowChange(o.value)}
          >
            {o.label} <span className="filter-chip__count">{counts[o.value]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
