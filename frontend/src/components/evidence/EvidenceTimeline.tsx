import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { studentRoutes } from '../../config/routes'
import { DIMENSION_LABELS, EVIDENCE_EVENT_LABELS, HINT_LEVEL_NAMES } from '../../content/labels'
import { formatClock, formatShortDate } from '../../lib/format'
import type { DevelopmentDimension, EvidenceEvent } from '../../types/domain'

interface Props {
  events: EvidenceEvent[]
  taskTitles?: Record<string, string>
  title?: string
  limit?: number
  emptyText?: string
  grouped?: boolean
  dimensionsByEvent?: Record<string, DevelopmentDimension[]>
}

function iconForEvent(type: EvidenceEvent['type']): string {
  switch (type) {
    case 'attempt-created':
      return '✏️'
    case 'hint-requested':
      return '💡'
    case 'retry':
      return '🔄'
    case 'feedback-applied':
      return '⚡'
    case 'task-completed':
      return '✅'
    case 'reflection-added':
      return '💭'
    case 'mission-completed':
      return '🎯'
    default:
      return '📌'
  }
}

export default function EvidenceTimeline({
  events,
  taskTitles = {},
  title = 'Observable Action Timeline',
  limit,
  emptyText,
  dimensionsByEvent = {},
}: Props) {
  const displayEvents = limit ? events.slice(0, limit) : events

  if (displayEvents.length === 0) {
    return (
      <Card big className="timeline-empty">
        <Badge tone="yellow">Action History</Badge>
        <h3>No actions recorded yet</h3>
        <p className="lead">
          {emptyText ||
            'Observable evidence starts forming automatically as you submit attempts, ask the Socratic mentor, and complete challenge tasks.'}
        </p>
      </Card>
    )
  }

  return (
    <Card big tone="white" className="evidence-timeline-card">
      <div className="timeline-header">
        <div>
          <Badge tone="blue">Observable Evidence</Badge>
          <h3 className="timeline-title">{title}</h3>
        </div>
        <span className="timeline-count">{events.length} actions logged</span>
      </div>

      <div className="timeline-track">
        {displayEvents.map((event, index) => {
          const taskTitle = taskTitles[event.taskId] || (event.taskId ? `Task #${event.taskId}` : undefined)
          const isLatest = index === 0
          const dimensions = dimensionsByEvent[event.id] || []

          return (
            <div key={event.id} className={`timeline-node ${isLatest ? 'timeline-node--latest' : ''}`}>
              <div className="timeline-node__marker">
                <span className="timeline-node__icon">{iconForEvent(event.type)}</span>
                {index < displayEvents.length - 1 && <div className="timeline-node__line" />}
              </div>

              <div className="timeline-node__body">
                <div className="timeline-node__top">
                  <div className="timeline-node__headline">
                    <strong>{EVIDENCE_EVENT_LABELS[event.type] || event.type}</strong>
                    {event.hintLevel !== undefined && (
                      <Badge tone="yellow" className="timeline-node__hint-badge">
                        {HINT_LEVEL_NAMES[event.hintLevel] || `Level ${event.hintLevel}`}
                      </Badge>
                    )}
                  </div>
                  <time className="timeline-node__time" dateTime={event.occurredAt}>
                    {formatShortDate(event.occurredAt)} at {formatClock(event.occurredAt)}
                  </time>
                </div>

                {taskTitle && (
                  <div className="timeline-node__context">
                    <span className="timeline-node__context-label">Academic Context:</span>{' '}
                    <Link to={studentRoutes.task(event.taskId)} className="timeline-node__task-link">
                      {taskTitle} →
                    </Link>
                  </div>
                )}

                {dimensions.length > 0 && (
                  <div className="timeline-node__dimensions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {dimensions.map((dim) => (
                      <Link key={dim} to={studentRoutes.growthDimension(dim)}>
                        <Badge tone="white" className="timeline-node__dim-badge">
                          {DIMENSION_LABELS[dim]}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
