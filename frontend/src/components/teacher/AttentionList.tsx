import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { ATTENTION_LABELS } from '../../content/labels'
import { teacherRoutes } from '../../config/routes'
import type { AttentionKind, AttentionNote } from '../../types/domain'

const TONES: Record<AttentionKind, 'info' | 'warning' | 'yellow'> = {
  'insufficient-evidence': 'info',
  'repeated-difficulty': 'warning',
  'inactive-work': 'warning',
  'observation-needed': 'yellow',
}

type Props = {
  notes: AttentionNote[]
  studentNames: Record<string, string>
}

/** Where a conversation might help. These are prompts to look closer, never rankings or scores. */
export default function AttentionList({ notes, studentNames }: Props) {
  return (
    <Card tone="softYellow" className="t-attn">
      <h2 className="section-title">Where to look next</h2>
      <p className="note">Prompts for a closer look, not judgements. Each one explains why it is shown.</p>
      {notes.length === 0 ? (
        <p>No one is flagged right now.</p>
      ) : (
        <ul className="attn-list">
          {notes.map((n) => (
            <li key={`${n.studentId}-${n.kind}`} className="attn-list__item">
              <div className="attn-list__head">
                <Link to={teacherRoutes.student(n.studentId)} className="text-link">
                  {studentNames[n.studentId] ?? 'Student'}
                </Link>
                <Badge tone={TONES[n.kind]}>{ATTENTION_LABELS[n.kind]}</Badge>
              </div>
              <p>{n.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
