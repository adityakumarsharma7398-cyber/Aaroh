// Frontend domain contracts. These describe what the UI needs, not how the
// backend stores it. Services map whatever the backend returns onto these types.

export const DEVELOPMENT_DIMENSIONS = [
  'self-reliance',
  'perseverance',
  'initiative',
  'problem-solving',
  'sustained-engagement',
] as const

export type DevelopmentDimension = (typeof DEVELOPMENT_DIMENSIONS)[number]

export function isDevelopmentDimension(value: string): value is DevelopmentDimension {
  return (DEVELOPMENT_DIMENSIONS as readonly string[]).includes(value)
}

export interface Student {
  id: string
  name: string
}

export interface Teacher {
  id: string
  name: string
}

// ---- Academic work -------------------------------------------------------

export type TaskStatus = 'not-started' | 'in-progress' | 'submitted' | 'completed'

/** Why a given task creates a chance to develop a given dimension. */
export interface DevelopmentOpportunity {
  dimension: DevelopmentDimension
  reason: string
}

/** A piece of academic work as a teacher defines it. Each student gets their own Task from it. */
export interface Activity {
  id: string
  title: string
  subject: string
  description: string
  estimatedMinutes: number
  opportunities: DevelopmentOpportunity[]
}

export interface Task {
  id: string
  studentId: string
  /** The teacher-defined activity this task is an instance of. */
  activityId: string
  title: string
  subject: string
  description: string
  status: TaskStatus
  estimatedMinutes: number
  opportunities: DevelopmentOpportunity[]
}

/** One saved piece of the student's own work on a task. */
export interface TaskAttempt {
  id: string
  studentId: string
  taskId: string
  content: string
  createdAt: string // ISO 8601
}

// ---- Growth missions -----------------------------------------------------

export type MissionStatus = 'available' | 'active' | 'completed'

export interface Mission {
  id: string
  studentId: string
  taskId: string
  title: string
  whyItMatters: string
  /** One small, concrete thing the student can do. */
  action: string
  dimension: DevelopmentDimension
  status: MissionStatus
}

/** The student's record of having carried out a mission's practical action. */
export interface MissionAttempt {
  id: string
  studentId: string
  missionId: string
  note: string
  createdAt: string // ISO 8601
}

// ---- Mentor --------------------------------------------------------------

/** 0 = independent thinking … 5 = full solution. */
export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5
export const MAX_HINT_LEVEL: HintLevel = 5

export interface MentorHint {
  id: string
  taskId: string
  level: HintLevel
  content: string
}

/**
 * Where a student is on the hint ladder for one task.
 * The application (not the model) decides how the level advances.
 */
export interface MentorSession {
  taskId: string
  /** Highest level delivered so far; 0 means no guidance requested yet. */
  currentLevel: HintLevel
  /** Delivered hints, lowest level first. */
  hints: MentorHint[]
}

// ---- Evidence and signals ------------------------------------------------

/** Observable actions only. Interpretation happens in the evidence engine, not here. */
export type EvidenceEventType =
  | 'attempt-created'
  | 'hint-requested'
  | 'retry'
  | 'feedback-applied'
  | 'task-completed'
  | 'reflection-added'
  | 'mission-completed'

export interface EvidenceEvent {
  id: string
  studentId: string
  taskId: string
  type: EvidenceEventType
  occurredAt: string // ISO 8601
  /** Present on 'hint-requested' events. */
  hintLevel?: HintLevel
  /** Present on 'mission-completed' events. */
  missionId?: string
}

export type SignalTrend = 'improving' | 'stable' | 'emerging' | 'needs-attention'

export interface DevelopmentSignal {
  id: string
  studentId: string
  dimension: DevelopmentDimension
  trend: SignalTrend
  /** Plain-language explanation of the pattern, written in careful, non-absolute wording. */
  summary: string
  /** The evidence this signal is based on, so the UI can always answer "why?". */
  evidenceEventIds: string[]
}

/** A short observation about the student's recent actions, grounded in evidence. */
export interface GrowthInsight {
  id: string
  studentId: string
  observation: string
  evidenceEventIds: string[]
}

// ---- Reflection ----------------------------------------------------------

export interface ReflectionAnswer {
  prompt: string
  response: string
}

export interface Reflection {
  id: string
  studentId: string
  taskId: string
  createdAt: string // ISO 8601
  answers: ReflectionAnswer[]
}

// ---- Teacher -------------------------------------------------------------

/** A note a teacher records about a student. Teacher-provided context, never a score. */
export interface TeacherObservation {
  id: string
  studentId: string
  text: string
  dimension?: DevelopmentDimension
  taskId?: string
  createdAt: string // ISO 8601
}

/** What the teacher submits when logging an observation. */
export interface ObservationInput {
  studentId: string
  text: string
  dimension?: DevelopmentDimension
  taskId?: string
}

/** What the teacher submits when creating an activity. */
export interface ActivityInput {
  title: string
  subject: string
  description: string
  estimatedMinutes: number
  dimensions: DevelopmentDimension[]
}

/**
 * A group-level qualitative summary for one dimension, built by the backend from students' own signals.
 * No `trend` means there is not enough evidence yet for a group-level view.
 */
export interface GroupSignal {
  dimension: DevelopmentDimension
  trend?: SignalTrend
  summary: string
  /** Students whose individual signals this summary draws on. */
  studentIds: string[]
  evidenceEventIds: string[]
}

export type AttentionKind =
  | 'insufficient-evidence'
  | 'repeated-difficulty'
  | 'inactive-work'
  | 'observation-needed'

/** A prompt for the teacher to look closer. It is a conversation starter, not a judgement. */
export interface AttentionNote {
  studentId: string
  kind: AttentionKind
  detail: string
}
