import { Link } from 'react-router-dom'
import { DIMENSION_LABELS, EVIDENCE_EVENT_TONES } from '../../content/labels'
import { studentRoutes } from '../../config/routes'
import { describeEvent, groupByDay } from '../../lib/evidence'
import { formatClock, formatEventTime } from '../../lib/format'
import type { DevelopmentDimension, EvidenceEvent } from '../../types/domain'

type Props = {
  /** Already ordered by the caller. */
  events: EvidenceEvent[]
  /** Task titles by task id, to say which task each action belongs to. */
  taskTitles?: Record<string, string>
  /** Signals each event contributes to, by event id. Shows the Action → Evidence → Signal link. */
  dimensionsByEvent?: Record<string, DevelopmentDimension[]>
  /** Group under a heading per calendar day. */
  grouped?: boolean
  emptyText?: string
}

export default function EvidenceTimeline({
  events,
  taskTitles,
  dimensionsByEvent,
  grouped,
  emptyText = 'No actions recorded yet.',
}: Props) {
  if (events.length === 0) return <p className="note">{emptyText}</p>

  const groups = grouped ? groupByDay(events) : [{ key: 'all', label: '', events }]

  return (
    <div className="evt">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label || undefined}>
          {group.label && <h3 className="evt__day">{group.label}</h3>}
          <ol className="evt__list">
            {group.events.map((e) => {
              const dims = dimensionsByEvent?.[e.id]
              return (
                <li key={e.id} className="evt__item">
                  <span className={`evt__dot evt__dot--${EVIDENCE_EVENT_TONES[e.type]}`} aria-hidden="true" />
                  <div className="evt__body">
                    <p className="evt__text">{describeEvent(e)}</p>
                    <p className="evt__meta">
                      {taskTitles?.[e.taskId] && <span>{taskTitles[e.taskId]} · </span>}
                      <time dateTime={e.occurredAt}>{grouped ? formatClock(e.occurredAt) : formatEventTime(e.occurredAt)}</time>
                    </p>
                    {dims && dims.length > 0 && (
                      <p className="evt__signals">
                        Contributes to:{' '}
                        {dims.map((d, i) => (
                          <span key={d}>
                            {i > 0 && ', '}
                            <Link to={studentRoutes.growthDimension(d)}>{DIMENSION_LABELS[d]}</Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
