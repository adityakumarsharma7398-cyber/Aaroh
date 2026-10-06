import { Link, useParams } from 'react-router-dom'
import AsyncView from '../../components/layout/AsyncView'
import BackLink from '../../components/layout/BackLink'
import NotFoundState from '../../components/layout/NotFoundState'
import PageHeader from '../../components/layout/PageHeader'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import ObservationList from '../../components/teacher/ObservationList'
import QuickLogForm from '../../components/teacher/QuickLogForm'
import SignalEvidenceCard from '../../components/teacher/SignalEvidenceCard'
import StudentProgress from '../../components/teacher/StudentProgress'
import EvidenceFeed from '../../components/teacher/EvidenceFeed'
import { ATTENTION_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import { describeEvent } from '../../lib/evidence'
import { formatEventTime } from '../../lib/format'
import { academicLabel, buildFeed, countStatuses, lastActivityOf } from '../../lib/teacher'
import { teacherObservationService } from '../../services/teacherObservationService'
import { DEVELOPMENT_DIMENSIONS, type ObservationInput } from '../../types/domain'
import { useStudentDetailData } from './teacherData'

export default function StudentDetailPage() {
  const { studentId = '' } = useParams()
  const state = useStudentDetailData(studentId)

  async function logObservation(input: ObservationInput) {
    await teacherObservationService.createObservation(input)
    state.reload()
  }

  return (
    <AsyncView state={state} loadingLabel="Loading the student…">
      {(data) => {
        if (!data) {
          return (
            <NotFoundState
              title="We couldn't find that student"
              message="They may not be in your group, or the link may be wrong."
              backTo={teacherRoutes.students}
              backLabel="Back to Students"
            />
          )
        }
        const { student, tasks, events, signals, observations, notes, taskTitles } = data
        const feed = buildFeed(events, [], signals)
        const lastAt = lastActivityOf(events)
        const lastEvent = events.find((e) => e.occurredAt === lastAt)
        const currentTask = tasks.find((t) => t.status === 'in-progress') ?? tasks.find((t) => t.status === 'not-started')

        return (
          <>
            <BackLink to={teacherRoutes.students}>All students</BackLink>
            <PageHeader
              title={student.name}
              description="Academic work, development signals and the evidence behind them. Signals are always explained by evidence and are never added into a score."
            />

            <div className="sdetail">
              <Card className="sdetail__ident">
                <h2 className="section-title">At a glance</h2>
                <dl className="facts">
                  <div>
                    <dt>Academic activity</dt>
                    <dd className="sdetail__small">{academicLabel(countStatuses(tasks))}</dd>
                  </div>
                  <div>
                    <dt>Current task</dt>
                    <dd className="sdetail__small">{currentTask?.title ?? 'No open task'}</dd>
                  </div>
                  <div>
                    <dt>Recent activity</dt>
                    <dd className="sdetail__small">
                      {lastEvent ? describeEvent(lastEvent) : 'No activity yet'}
                      {lastAt && <span className="facts__sub">{formatEventTime(lastAt)}</span>}
                    </dd>
                  </div>
                </dl>
                {notes.length > 0 && (
                  <div className="sdetail__flags">
                    <span className="note">Worth a closer look:</span>
                    {notes.map((n) => (
                      <Badge key={n.kind} tone="yellow">{ATTENTION_LABELS[n.kind]}</Badge>
                    ))}
                  </div>
                )}
              </Card>

              <div className="sdetail__progress">
                <StudentProgress tasks={tasks} events={events} />
              </div>

              <section className="sdetail__signals" aria-labelledby="signals-h">
                <h2 id="signals-h" className="subhead">Development signals</h2>
                <ul className="sdetail__sigs">
                  {DEVELOPMENT_DIMENSIONS.map((dimension) => {
                    const signal = signals.find((s) => s.dimension === dimension)
                    const evidence = events.filter((e) => signal?.evidenceEventIds.includes(e.id))
                    return (
                      <li key={dimension}>
                        <SignalEvidenceCard dimension={dimension} signal={signal} evidence={evidence} taskTitles={taskTitles} />
                      </li>
                    )
                  })}
                </ul>
              </section>

              <div className="sdetail__evidence">
                <Card>
                  <h2 className="section-title">Evidence</h2>
                  <p className="note">Recorded actions, newest first. Evidence is what happened. Signals are interpretations.</p>
                  <EvidenceFeed
                    items={feed}
                    pageSize={8}
                    showStudent={false}
                    studentNames={{ [student.id]: student.name }}
                    taskTitles={taskTitles}
                    emptyText="No actions recorded for this student yet."
                  />
                  <Link to={teacherRoutes.evidence({ student: student.id })} className="text-link">
                    Open in Evidence with filters
                  </Link>
                </Card>
              </div>

              <div className="sdetail__obs">
                <ObservationList observations={observations} taskTitles={taskTitles} />
              </div>

              <div className="sdetail__log">
                <QuickLogForm
                  students={[student]}
                  tasks={tasks}
                  fixedStudentId={student.id}
                  onSubmit={logObservation}
                />
              </div>
            </div>
          </>
        )
      }}
    </AsyncView>
  )
}
