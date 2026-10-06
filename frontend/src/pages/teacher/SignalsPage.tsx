import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AsyncView from '../../components/layout/AsyncView'
import PageHeader from '../../components/layout/PageHeader'
import EvidenceFlowExplainer from '../../components/evidence/EvidenceFlowExplainer'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { SignalBadge } from '../../components/ui/SignalList'
import EvidenceFeed from '../../components/teacher/EvidenceFeed'
import GroupSignalCard from '../../components/teacher/GroupSignalCard'
import { DIMENSION_DESCRIPTIONS } from '../../content/dimensions'
import { DIMENSION_LABELS, SIGNAL_TREND_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import { buildFeed } from '../../lib/teacher'
import {
  DEVELOPMENT_DIMENSIONS,
  isDevelopmentDimension,
  type DevelopmentSignal,
  type EvidenceEvent,
  type GroupSignal,
} from '../../types/domain'
import { useGroupSignalsData } from './teacherData'

const STEPS = [
  { tone: 'softYellow', title: 'Signal', text: 'A qualitative summary of a pattern. It is an interpretation, never a score.' },
  { tone: 'softBlue', title: 'Evidence', text: 'The recorded actions the signal rests on. Evidence is what happened.' },
  { tone: 'softPink', title: 'Context', text: 'The student, the task and any teacher observations around it.' },
] as const

interface ViewProps {
  groupSignals: GroupSignal[]
  signals: DevelopmentSignal[]
  events: EvidenceEvent[]
  studentNames: Record<string, string>
  taskTitles: Record<string, string>
}

function SignalsView({ groupSignals, signals, events, studentNames, taskTitles }: ViewProps) {
  const [params] = useSearchParams()
  const requested = params.get('dimension') ?? ''
  const dimension = isDevelopmentDimension(requested) ? requested : DEVELOPMENT_DIMENSIONS[0]
  const group = groupSignals.find((g) => g.dimension === dimension)

  // Bring the detail into view when a different dimension is picked (matters on narrow screens).
  const detailRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [dimension])

  if (!group) return null

  const studentSignals = signals.filter((s) => s.dimension === dimension)
  const supporting = events.filter((e) => group.evidenceEventIds.includes(e.id))
  const feed = buildFeed(supporting, [], signals)

  return (
    <div className="sigpage">
      <ul className="sigpage__list" aria-label="Dimensions">
        {groupSignals.map((g) => (
          <li key={g.dimension}>
            <GroupSignalCard signal={g} selected={g.dimension === dimension} />
          </li>
        ))}
      </ul>

      <div className="sigpage__detail" ref={detailRef} tabIndex={-1}>
        <Card big>
          <div className="sigpage__title">
            <h2 className="section-title">{DIMENSION_LABELS[dimension]}</h2>
            <SignalBadge trend={group.trend ? SIGNAL_TREND_LABELS[group.trend] : 'Not enough evidence yet'} />
          </div>
          <p className="note">{DIMENSION_DESCRIPTIONS[dimension]}</p>

          <h3 className="sigpage__h">Why is this signal shown?</h3>
          <p>{group.summary}</p>
          <p className="note">
            A summary of individual signals, not a measure of any student. It can change as new evidence arrives.
          </p>

          <h3 className="sigpage__h">Students with a signal</h3>
          {studentSignals.length === 0 ? (
            <p className="note">No student has a signal for this dimension yet.</p>
          ) : (
            <ul className="signals">
              {studentSignals
                .slice()
                .sort((a, b) => (studentNames[a.studentId] ?? '').localeCompare(studentNames[b.studentId] ?? ''))
                .map((s) => (
                  <li key={s.id}>
                    <Link to={teacherRoutes.student(s.studentId)} className="text-link">
                      {studentNames[s.studentId] ?? 'Student'}
                    </Link>
                    <SignalBadge trend={SIGNAL_TREND_LABELS[s.trend]} />
                  </li>
                ))}
            </ul>
          )}
          <p className="note">Listed alphabetically. There is no ranking.</p>

          <h3 className="sigpage__h">Supporting evidence</h3>
          <EvidenceFeed
            items={feed}
            pageSize={6}
            studentNames={studentNames}
            taskTitles={taskTitles}
            emptyText="There is no supporting evidence for this dimension yet."
          />
          {feed.length > 0 && (
            <Link to={teacherRoutes.evidence({ dimension })} className="text-link">
              Open this evidence with filters
            </Link>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function SignalsPage() {
  const state = useGroupSignalsData()

  return (
    <>
      <PageHeader
        title="Growth Signals"
        description="A group-level view of development signals. Pick a dimension to see the evidence that supports it."
      />
      <Badge tone="yellow">Qualitative only · no scores · no rankings</Badge>
      <EvidenceFlowExplainer steps={[...STEPS]} />
      <AsyncView state={state} loadingLabel="Loading signals…">
        {(d) => <SignalsView {...d} />}
      </AsyncView>
    </>
  )
}
