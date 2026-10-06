// Display text for domain values. Keeps wording out of components and out of the data layer.
import type { SignalItem } from '../components/ui/SignalList'
import type { StatusFilter } from '../lib/tasks'
import type {
  AttentionKind,
  DevelopmentDimension,
  EvidenceEventType,
  HintLevel,
  MissionStatus,
  SignalTrend,
  TaskStatus,
} from '../types/domain'

export const DIMENSION_LABELS: Record<DevelopmentDimension, string> = {
  'self-reliance': 'Self-Reliance',
  perseverance: 'Perseverance',
  initiative: 'Initiative',
  'problem-solving': 'Problem-Solving',
  'sustained-engagement': 'Sustained Engagement',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  submitted: 'Submitted',
  completed: 'Completed',
}

// Factual wording only: events say what the student did, never what it says about them.
export const EVIDENCE_EVENT_LABELS: Record<EvidenceEventType, string> = {
  'attempt-created': 'Saved an attempt',
  'hint-requested': 'Requested a hint',
  retry: 'Saved another attempt',
  'feedback-applied': 'Applied feedback',
  'task-completed': 'Completed the task',
  'reflection-added': 'Added a reflection',
  'mission-completed': 'Completed a growth mission',
}

/** Marker colour per kind of event (blue academic, yellow guidance, orange action, pink reflection). */
export const EVIDENCE_EVENT_TONES: Record<EvidenceEventType, 'blue' | 'yellow' | 'orange' | 'pink' | 'green'> = {
  'attempt-created': 'blue',
  'hint-requested': 'yellow',
  retry: 'blue',
  'feedback-applied': 'yellow',
  'task-completed': 'green',
  'reflection-added': 'pink',
  'mission-completed': 'orange',
}

export const HINT_LEVEL_NAMES: Record<HintLevel, string> = {
  0: 'Independent Thinking',
  1: 'Reflective Prompt',
  2: 'Conceptual Hint',
  3: 'Structured Guidance',
  4: 'Worked Example',
  5: 'Solution',
}

/** What the mentor does at each level, in the student's terms. */
export const HINT_LEVEL_DESCRIPTIONS: Record<HintLevel, string> = {
  0: 'You think and work on your own. No guidance yet.',
  1: 'A question to help you check your own thinking.',
  2: 'A pointer to the idea that matters, without the steps.',
  3: 'A suggested order of steps to follow.',
  4: 'A similar example worked through, not your exact problem.',
  5: 'The full solution, shown last.',
}

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  available: 'Recommended',
  active: 'Active',
  completed: 'Completed',
}

export const SIGNAL_TREND_LABELS: Record<SignalTrend, SignalItem['trend']> = {
  improving: 'Improving',
  stable: 'Stable',
  emerging: 'Emerging',
  'needs-attention': 'Needs attention',
}

export const TASK_STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

/** Evidence on the teacher side also includes the teacher's own observations. */
export type EvidenceKind = EvidenceEventType | 'teacher-observation'

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  ...EVIDENCE_EVENT_LABELS,
  'teacher-observation': 'Teacher observation',
}

export const ATTENTION_LABELS: Record<AttentionKind, string> = {
  'insufficient-evidence': 'Not enough evidence yet',
  'repeated-difficulty': 'Repeated difficulty',
  'inactive-work': 'Inactive academic work',
  'observation-needed': 'Teacher observation needed',
}

/** How the server gave a piece of guidance (the backend's `responseMode`). Unknown modes fall back to readable text. */
const RESPONSE_MODE_LABELS: Record<string, string> = {
  independent_thinking_pushback: 'Think it through first',
  reflective_prompt: 'Reflective prompt',
  conceptual_hint: 'Conceptual hint',
  structured_guidance: 'Structured guidance',
  worked_example: 'Worked example',
  direct_solution: 'Direct solution',
}

export function responseModeLabel(mode: string): string {
  return RESPONSE_MODE_LABELS[mode] ?? mode.replace(/_/g, ' ')
}
