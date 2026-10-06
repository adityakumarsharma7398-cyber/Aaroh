import { useMemo, useState } from 'react'
import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import StudentFilters from '../../components/teacher/StudentFilters'
import StudentsTable from '../../components/teacher/StudentsTable'
import {
  buildStudentSummaries,
  filterStudentSummaries,
  type StudentShow,
  type StudentSummary,
} from '../../lib/teacher'
import { useStudentsData } from './teacherData'

function StudentsView({ rows }: { rows: StudentSummary[] }) {
  const [query, setQuery] = useState('')
  const [show, setShow] = useState<StudentShow>('all')

  const visible = useMemo(() => filterStudentSummaries(rows, query, show), [rows, query, show])
  const counts: Record<StudentShow, number> = {
    all: rows.length,
    'in-progress': rows.filter((r) => r.counts.inProgress > 0).length,
    flagged: rows.filter((r) => r.notes.length > 0).length,
  }

  return (
    <>
      <StudentFilters query={query} onQueryChange={setQuery} show={show} onShowChange={setShow} counts={counts} />
      <p role="status" className="note tasks__count">
        Showing {visible.length} of {rows.length} {rows.length === 1 ? 'student' : 'students'}
      </p>
      {visible.length === 0 ? (
        <Card tone="softYellow" big className="tasks__empty">
          <h2 className="section-title">No students match.</h2>
          <p>Try a different name or filter.</p>
          <Button
            variant="light"
            onClick={() => {
              setQuery('')
              setShow('all')
            }}
          >
            Clear filters
          </Button>
        </Card>
      ) : (
        <StudentsTable rows={visible} />
      )}
    </>
  )
}

export default function StudentsPage() {
  const state = useStudentsData()

  return (
    <>
      <PageHeader
        title="Students"
        description="Find a student quickly. The list is always alphabetical, never ordered by performance."
      />
      <AsyncView state={state} loadingLabel="Loading students…">
        {(d) => <StudentsView rows={buildStudentSummaries(d)} />}
      </AsyncView>
    </>
  )
}
