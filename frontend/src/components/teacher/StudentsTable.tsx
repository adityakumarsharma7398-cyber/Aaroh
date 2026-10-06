import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { SignalBadge } from '../ui/SignalList'
import { ATTENTION_LABELS, DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import { formatEventTime } from '../../lib/format'
import { academicLabel, type StudentSummary } from '../../lib/teacher'
import { DEVELOPMENT_DIMENSIONS } from '../../types/domain'

function Signals({ row }: { row: StudentSummary }) {
  if (row.signals.length === 0) return <SignalBadge trend="Not enough evidence yet" />
  const ordered = DEVELOPMENT_DIMENSIONS.flatMap((d) => row.signals.filter((s) => s.dimension === d))
  return (
    <ul className="mini-signals">
      {ordered.slice(0, 3).map((s) => (
        <li key={s.id}>
          <span>{DIMENSION_LABELS[s.dimension]}</span>
          <SignalBadge trend={SIGNAL_TREND_LABELS[s.trend]} />
        </li>
      ))}
      {ordered.length > 3 && <li className="mini-signals__more">+{ordered.length - 3} more in the student view</li>}
    </ul>
  )
}

function Flags({ row }: { row: StudentSummary }) {
  if (row.notes.length === 0) return null
  return (
    <span className="flags">
      {row.notes.map((n) => (
        <Badge key={n.kind} tone="yellow">{ATTENTION_LABELS[n.kind]}</Badge>
      ))}
    </span>
  )
}

const lastActivity = (row: StudentSummary) => (row.lastActivityAt ? formatEventTime(row.lastActivityAt) : 'No activity yet')
const currentTask = (row: StudentSummary) => row.currentTask?.title ?? 'No open task'

/** A table on wide screens and one card per student on narrow ones, from the same rows. */
export default function StudentsTable({ rows }: { rows: StudentSummary[] }) {
  return (
    <>
      <div className="students-table-wrap">
        <table className="students-table">
          <caption className="sr-only">Students, in alphabetical order</caption>
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Academic activity</th>
              <th scope="col">Current task</th>
              <th scope="col">Development signals</th>
              <th scope="col">Last activity</th>
              <th scope="col"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student.id}>
                <th scope="row">
                  <span className="students-table__name">{row.student.name}</span>
                  <Flags row={row} />
                </th>
                <td>{academicLabel(row.counts)}</td>
                <td>{currentTask(row)}</td>
                <td><Signals row={row} /></td>
                <td>{lastActivity(row)}</td>
                <td>
                  <Button to={teacherRoutes.student(row.student.id)} variant="light">
                    View student<span className="sr-only">: {row.student.name}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="students-cards">
        {rows.map((row) => (
          <li key={row.student.id} className="card student-card">
            <h2 className="section-title">{row.student.name}</h2>
            <Flags row={row} />
            <dl className="student-card__facts">
              <div><dt>Academic activity</dt><dd>{academicLabel(row.counts)}</dd></div>
              <div><dt>Current task</dt><dd>{currentTask(row)}</dd></div>
              <div><dt>Development signals</dt><dd><Signals row={row} /></dd></div>
              <div><dt>Last activity</dt><dd>{lastActivity(row)}</dd></div>
            </dl>
            <Button to={teacherRoutes.student(row.student.id)} variant="light" arrow>
              View student<span className="sr-only">: {row.student.name}</span>
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
