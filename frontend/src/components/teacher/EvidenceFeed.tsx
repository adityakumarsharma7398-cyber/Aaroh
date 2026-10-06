import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import { DIMENSION_LABELS, EVIDENCE_EVENT_TONES } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import { describeEvent } from '../../lib/evidence'
import { formatEventTime } from '../../lib/format'
import type { FeedItem } from '../../lib/teacher'

type Props = {
  items: FeedItem[]
  studentNames: Record<string, string>
  taskTitles: Record<string, string>
  /** Show who each item is about. Turn off on a single student's page. */
  showStudent?: boolean
  /** How many to show before offering "Show more". */
  pageSize?: number
  emptyText?: string
}

/** Who, what, when and in which context. Events and teacher observations are shown as recorded, not interpreted. */
export default function EvidenceFeed({
  items,
  studentNames,
  taskTitles,
  showStudent = true,
  pageSize = 30,
  emptyText = 'No evidence matches.',
}: Props) {
  const [visible, setVisible] = useState(pageSize)
  if (items.length === 0) return <p className="note">{emptyText}</p>

  const shown = items.slice(0, visible)

  return (
    <div className="feed">
      <ol className="evt__list">
        {shown.map((item) => {
          const isNote = item.kind === 'teacher-observation'
          const tone = isNote ? 'pink' : EVIDENCE_EVENT_TONES[item.event!.type]
          const context = [item.taskId ? taskTitles[item.taskId] : undefined].filter(Boolean)
          return (
            <li key={item.id} className="evt__item">
              <span className={`evt__dot evt__dot--${tone}`} aria-hidden="true" />
              <div className="evt__body">
                <p className="evt__text">{isNote ? 'Teacher observation' : describeEvent(item.event!)}</p>
                {item.observation && <p className="feed__quote">{item.observation.text}</p>}
                <p className="evt__meta">
                  {showStudent && (
                    <>
                      <Link to={teacherRoutes.student(item.studentId)} className="text-link">
                        {studentNames[item.studentId] ?? 'Student'}
                      </Link>
                      {' · '}
                    </>
                  )}
                  {context.map((c) => (
                    <span key={c}>{c} · </span>
                  ))}
                  <time dateTime={item.at}>{formatEventTime(item.at)}</time>
                </p>
                {item.dimensions.length > 0 && (
                  <p className="evt__signals">
                    {isNote ? 'Dimension' : 'Contributes to'}:{' '}
                    {item.dimensions.map((d, i) => (
                      <span key={d}>
                        {i > 0 && ', '}
                        <Link to={teacherRoutes.signal(d)}>{DIMENSION_LABELS[d]}</Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {visible < items.length && (
        <Button variant="light" onClick={() => setVisible((v) => v + pageSize)}>
          Show more ({items.length - visible} left)
        </Button>
      )}
    </div>
  )
}
