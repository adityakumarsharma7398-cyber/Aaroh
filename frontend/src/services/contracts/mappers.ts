// Backend response -> UI domain types. Used by services (and only services) so that no page or component knows
// the backend's shapes, vocabulary or field names. Shapes follow server/API.md and were checked against the
// running server.
//
// Rules:
//  - Validate what we rely on; throw on a malformed payload (apiClient turns that into an 'unexpected-response' error).
//  - Never invent data. A field the backend does not have is left empty / undefined, and anything the UI has
//    no honest equivalent for is dropped (the mapper returns undefined).
import type {
  DevelopmentSignal,
  EvidenceEvent,
  EvidenceRecord,
  GrowthInsight,
  HintLevel,
  MentorHint,
  MentorSession,
  Mission,
  MissionAttempt,
  Reflection,
  SignalTrend,
  Student,
  Task,
  TaskAttempt,
  TaskStatus,
} from '../../types/domain'
import { fromCanonicalDimension, fromCanonicalEventType } from './vocabulary'

type Rec = Record<string, unknown>

function rec(value: unknown, what: string): Rec {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${what}: expected an object`)
  return value as Rec
}
function str(value: unknown, what: string): string {
  if (typeof value !== 'string') throw new Error(`${what}: expected a string`)
  return value
}
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const strings = (value: unknown): string[] => arr(value).filter((v): v is string => typeof v === 'string')

function hintLevel(value: unknown): HintLevel | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5 ? (value as HintLevel) : undefined
}

// ---- Student ---------------------------------------------------------------

export function mapStudent(raw: unknown): Student {
  const r = rec(raw, 'student')
  return { id: str(r.id, 'student.id'), name: str(r.name, 'student.name') }
}

// ---- Tasks -----------------------------------------------------------------

const TASK_STATUSES: TaskStatus[] = ['not-started', 'in-progress', 'completed']

/**
 * The backend `tasks` table is curriculum-level: no per-student id, effort estimate or development opportunities.
 * So: studentId is the authenticated student's, activityId is the task's own id, effort is left undefined and
 * opportunities are empty (the UI hides what is missing).
 */
export function mapTask(raw: unknown, studentId: string): Task {
  const r = rec(raw, 'task')
  const status = r.status as TaskStatus
  if (!TASK_STATUSES.includes(status)) throw new Error('task.status: unknown status')
  const id = str(r.id, 'task.id')
  return {
    id,
    studentId,
    activityId: id,
    title: str(r.title, 'task.title'),
    subject: str(r.subject, 'task.subject'),
    description: typeof r.description === 'string' ? r.description : '',
    status,
    opportunities: [],
  }
}

export function mapAttempt(raw: unknown): TaskAttempt {
  const r = rec(raw, 'attempt')
  return {
    id: str(r.id, 'attempt.id'),
    studentId: str(r.studentId, 'attempt.studentId'),
    taskId: str(r.taskId, 'attempt.taskId'),
    content: typeof r.content === 'string' ? r.content : '',
    createdAt: str(r.createdAt, 'attempt.createdAt'),
  }
}

// ---- Missions --------------------------------------------------------------

/**
 * The backend mission has one `instruction` and a list of dimensions; it has no separate title, "why" or action.
 * The instruction becomes the title, and the first dimension the UI recognises becomes the primary one.
 */
export function mapMission(raw: unknown): Mission | undefined {
  const r = rec(raw, 'mission')
  const dimension = arr(r.dimensions)
    .map((d) => (typeof d === 'string' ? fromCanonicalDimension(d) : undefined))
    .find((d) => d !== undefined)
  if (!dimension) return undefined
  const status = r.status
  if (status !== 'active' && status !== 'completed') throw new Error('mission.status: unknown status')
  return {
    id: str(r.id, 'mission.id'),
    studentId: str(r.studentId, 'mission.studentId'),
    taskId: str(r.taskId, 'mission.taskId'),
    title: str(r.instruction, 'mission.instruction'),
    dimension,
    status,
  }
}

// ---- Events and evidence ---------------------------------------------------

/**
 * Backend event -> UI evidence event, or undefined when the UI has no matching event.
 *  - hint_level_granted is shown as the hint event (with its granted level); hint_requested precedes it and is skipped.
 *  - A `completed` event whose metadata says action=mission_completed is a mission completion, not a task completion.
 *  - teacher_observation is not student evidence in this UI and is skipped.
 */
export function mapEvent(raw: unknown): EvidenceEvent | undefined {
  const r = rec(raw, 'event')
  const type = str(r.type, 'event.type')
  const meta = r.metadata !== null && typeof r.metadata === 'object' ? (r.metadata as Rec) : {}

  let uiType = fromCanonicalEventType(type)
  if (type === 'completed' && meta.action === 'mission_completed') uiType = 'mission-completed'
  if (!uiType) return undefined

  const event: EvidenceEvent = {
    id: str(r.id, 'event.id'),
    studentId: str(r.studentId, 'event.studentId'),
    taskId: typeof r.taskId === 'string' ? r.taskId : '',
    type: uiType,
    occurredAt: str(r.createdAt, 'event.createdAt'),
  }
  if (type === 'hint_level_granted') {
    const level = hintLevel(meta.level)
    if (level === undefined) return undefined
    event.hintLevel = level
  }
  if (uiType === 'mission-completed' && typeof meta.missionId === 'string') event.missionId = meta.missionId
  return event
}

/** Mission attempts are recorded by the backend as `completed` events with mission metadata (newest first by the caller). */
export function mapMissionAttempt(raw: unknown): MissionAttempt | undefined {
  const r = rec(raw, 'event')
  const meta = r.metadata !== null && typeof r.metadata === 'object' ? (r.metadata as Rec) : {}
  if (r.type !== 'completed' || meta.action !== 'mission_completed' || typeof meta.missionId !== 'string') return undefined
  return {
    id: str(r.id, 'event.id'),
    studentId: str(r.studentId, 'event.studentId'),
    missionId: meta.missionId,
    note: typeof meta.note === 'string' ? meta.note : '',
    createdAt: str(r.createdAt, 'event.createdAt'),
  }
}

export function mapEvidenceRecord(raw: unknown): EvidenceRecord | undefined {
  const r = rec(raw, 'evidence')
  const dimension = fromCanonicalDimension(str(r.dimension, 'evidence.dimension'))
  if (!dimension) return undefined
  const strength = r.strength
  if (strength !== 'insufficient' && strength !== 'emerging' && strength !== 'developing' && strength !== 'strengthening') {
    throw new Error('evidence.strength: unknown strength')
  }
  return {
    id: str(r.id, 'evidence.id'),
    studentId: str(r.studentId, 'evidence.studentId'),
    taskId: typeof r.taskId === 'string' ? r.taskId : undefined,
    dimension,
    ruleId: str(r.ruleId, 'evidence.ruleId'),
    summary: str(r.summary, 'evidence.summary'),
    supportingEventIds: strings(r.supportingEventIds),
    strength,
  }
}

// ---- Development signals ---------------------------------------------------

/**
 * INTERIM mapping from the backend's signal vocabulary to the UI's, pending product confirmation:
 *   state `insufficient_data`                         -> no signal (the UI says "Not enough evidence yet")
 *   state `neutral`                                   -> 'stable'
 *   state `positive` + strength `emerging`            -> 'emerging'
 *   state `positive` + strength `developing` / `strengthening` -> 'improving'
 * The frontend only translates wording. It never computes or reinterprets a signal.
 */
function trendFor(state: unknown, strength: unknown): SignalTrend | undefined {
  if (state === 'neutral') return 'stable'
  if (state === 'positive') {
    if (strength === 'emerging') return 'emerging'
    if (strength === 'developing' || strength === 'strengthening') return 'improving'
  }
  return undefined
}

export function mapSignal(raw: unknown): DevelopmentSignal | undefined {
  const r = rec(raw, 'signal')
  const dimension = fromCanonicalDimension(str(r.dimension, 'signal.dimension'))
  const trend = trendFor(r.state, r.evidenceStrength)
  if (!dimension || !trend) return undefined
  return {
    id: str(r.id, 'signal.id'),
    studentId: str(r.studentId, 'signal.studentId'),
    dimension,
    trend,
    summary: str(r.summary, 'signal.summary'),
    evidenceEventIds: strings(r.supportingEventIds),
  }
}

export function mapInsight(raw: unknown): GrowthInsight | undefined {
  if (raw === null || raw === undefined) return undefined
  const r = rec(raw, 'insight')
  return {
    id: str(r.id, 'insight.id'),
    studentId: str(r.studentId, 'insight.studentId'),
    observation: str(r.observation, 'insight.observation'),
    evidenceEventIds: strings(r.evidenceEventIds),
  }
}

// ---- Mentor ----------------------------------------------------------------

export function mapMentorHint(raw: unknown): MentorHint {
  const r = rec(raw, 'hint')
  const level = hintLevel(r.level)
  if (level === undefined) throw new Error('hint.level: expected 0-5')
  return {
    id: str(r.id, 'hint.id'),
    taskId: str(r.taskId, 'hint.taskId'),
    level,
    content: str(r.content, 'hint.content'),
    responseMode: typeof r.responseMode === 'string' ? r.responseMode : undefined,
    grantedAt: typeof r.grantedAt === 'string' ? r.grantedAt : undefined,
  }
}

export function mapMentorSession(raw: unknown): MentorSession {
  const r = rec(raw, 'mentor session')
  const level = hintLevel(r.currentLevel)
  if (level === undefined) throw new Error('session.currentLevel: expected 0-5')
  return {
    taskId: str(r.taskId, 'session.taskId'),
    currentLevel: level,
    hints: arr(r.hints).map(mapMentorHint).sort((a, b) => a.level - b.level),
  }
}

// ---- Reflection ------------------------------------------------------------

export function mapReflection(raw: unknown): Reflection | undefined {
  if (raw === null || raw === undefined) return undefined
  const r = rec(raw, 'reflection')
  return {
    id: str(r.id, 'reflection.id'),
    studentId: str(r.studentId, 'reflection.studentId'),
    taskId: str(r.taskId, 'reflection.taskId'),
    createdAt: str(r.createdAt, 'reflection.createdAt'),
    answers: arr(r.answers)
      .map((a) => rec(a, 'reflection.answer'))
      .map((a) => ({ prompt: str(a.prompt, 'answer.prompt'), response: str(a.response, 'answer.response') })),
  }
}

// ---- Lists -----------------------------------------------------------------

/** Maps every item of a response array, dropping the ones a mapper declines (returns undefined). Throws if not an array. */
export function mapList<T>(raw: unknown, map: (item: unknown) => T | undefined): T[] {
  if (!Array.isArray(raw)) throw new Error('expected an array')
  return raw.map(map).filter((item): item is T => item !== undefined)
}
