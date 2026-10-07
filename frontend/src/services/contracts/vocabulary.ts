// Vocabulary at the backend boundary.
//
// The backend and AI layer use canonical values (snake_case dimensions, snake_case event types). The UI
// keeps its readable forms. Services translate here, so no page or component changes when the backend does.
//
// CANONICAL types below mirror shared/src/types/{signal,event}.ts. frontend/ is its own package and does not
// import the workspace `shared` package, so keep these in sync by hand (a real contract package is a later step).
//
// Verified live against the AI routes: sending the UI form ("self-reliance") returns HTTP 400.
import type { DevelopmentDimension, EvidenceEventType } from '../../types/domain'

// ---- Development dimensions -------------------------------------------------

export type CanonicalDimension =
  | 'self_reliance'
  | 'perseverance'
  | 'problem_solving'
  | 'initiative'
  | 'sustained_engagement'

const DIMENSIONS: Record<DevelopmentDimension, CanonicalDimension> = {
  'self-reliance': 'self_reliance',
  perseverance: 'perseverance',
  'problem-solving': 'problem_solving',
  initiative: 'initiative',
  'sustained-engagement': 'sustained_engagement',
}

/** UI form -> value to send to the backend / AI. */
export function toCanonicalDimension(dimension: DevelopmentDimension): CanonicalDimension {
  return DIMENSIONS[dimension]
}

/** Backend value -> UI form, or undefined if the backend sent something this UI does not know. */
export function fromCanonicalDimension(value: string): DevelopmentDimension | undefined {
  return (Object.keys(DIMENSIONS) as DevelopmentDimension[]).find((d) => DIMENSIONS[d] === value)
}

// ---- Event types (inbound only) --------------------------------------------
// The frontend never writes events: the backend records them as a side effect of student actions.
// So only backend -> UI translation is needed.

export type CanonicalEventType =
  | 'attempt'
  | 'hint_requested'
  | 'hint_level_granted'
  | 'retry'
  | 'feedback_applied'
  | 'completed'
  | 'reflection'
  | 'teacher_observation'

/**
 * Backend event -> the UI event it is shown as.
 *
 * `undefined` means the UI has no matching event and the item must not be invented:
 *  - hint_requested: the request that precedes a grant. The UI shows the granted level instead.
 *  - teacher_observation: the UI models these as TeacherObservation, not as an evidence event.
 * Note the reverse gap: the UI has 'mission-completed' but the backend has no such event type.
 * The hint mapping is the best fit but needs confirmation from Member 3 (see docs/FRONTEND_INTEGRATION.md).
 */
const EVENTS: Record<CanonicalEventType, EvidenceEventType | undefined> = {
  attempt: 'attempt-created',
  retry: 'retry',
  feedback_applied: 'feedback-applied',
  completed: 'task-completed',
  reflection: 'reflection-added',
  hint_level_granted: 'hint-requested',
  hint_requested: undefined,
  teacher_observation: undefined,
}

export function fromCanonicalEventType(value: string): EvidenceEventType | undefined {
  return Object.prototype.hasOwnProperty.call(EVENTS, value) ? EVENTS[value as CanonicalEventType] : undefined
}
