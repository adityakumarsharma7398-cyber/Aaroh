// Pure view helpers for the teacher pages: counting, grouping, filtering and ordering data that
// is already loaded. Nothing here interprets evidence or produces a score; interpretation is the backend's job.
import { dimensionsByEvent } from './evidence'
import type { EvidenceKind } from '../content/labels'
import type {
  AttentionNote,
  DevelopmentDimension,
  DevelopmentSignal,
  EvidenceEvent,
  Student,
  Task,
  TeacherObservation,
} from '../types/domain'

const DAY_MS = 24 * 60 * 60 * 1000

// ---- Task counts and activity summary ------------------------------------

export interface StatusCounts {
  notStarted: number
  inProgress: number
  completed: number
}

/** A submitted task is finished from the student's side, so it is counted as completed. */
export function countStatuses(tasks: Task[]): StatusCounts {
  return {
    notStarted: tasks.filter((t) => t.status === 'not-started').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed' || t.status === 'submitted').length,
  }
}

export interface ActivitySummary {
  studentCount: number
  studentsWorking: number
  tasksInProgress: number
  tasksCompleted: number
  taskTotal: number
  /** Actions recorded in the 7 days up to the most recent recorded action. */
  recentActions: number
  windowEnd?: string
}

export function summariseActivity(students: Student[], tasks: Task[], events: EvidenceEvent[]): ActivitySummary {
  const counts = countStatuses(tasks)
  const working = new Set(tasks.filter((t) => t.status === 'in-progress').map((t) => t.studentId))
  const times = events.map((e) => Date.parse(e.occurredAt))
  const latest = times.length ? Math.max(...times) : undefined
  return {
    studentCount: students.length,
    studentsWorking: working.size,
    tasksInProgress: counts.inProgress,
    tasksCompleted: counts.completed,
    taskTotal: tasks.length,
    recentActions: latest === undefined ? 0 : times.filter((t) => t > latest - 7 * DAY_MS).length,
    windowEnd: latest === undefined ? undefined : new Date(latest).toISOString(),
  }
}

// ---- Students list --------------------------------------------------------

export interface StudentSummary {
  student: Student
  counts: StatusCounts
  currentTask?: Task
  signals: DevelopmentSignal[]
  lastActivityAt?: string
  notes: AttentionNote[]
}

interface SummaryInput {
  students: Student[]
  tasks: Task[]
  events: EvidenceEvent[]
  signals: DevelopmentSignal[]
  notes: AttentionNote[]
  /** The service's recommended current task per student id. */
  currentTasks: Record<string, Task | undefined>
}

export function lastActivityOf(events: EvidenceEvent[]): string | undefined {
  if (events.length === 0) return undefined
  return events.reduce((a, b) => (Date.parse(b.occurredAt) > Date.parse(a.occurredAt) ? b : a)).occurredAt
}

/** One row per student, always alphabetical. There is deliberately no ordering by performance. */
export function buildStudentSummaries({ students, tasks, events, signals, notes, currentTasks }: SummaryInput): StudentSummary[] {
  return [...students]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => ({
      student,
      counts: countStatuses(tasks.filter((t) => t.studentId === student.id)),
      currentTask: currentTasks[student.id],
      signals: signals.filter((s) => s.studentId === student.id),
      lastActivityAt: lastActivityOf(events.filter((e) => e.studentId === student.id)),
      notes: notes.filter((n) => n.studentId === student.id),
    }))
}

export type StudentShow = 'all' | 'in-progress' | 'flagged'

export function filterStudentSummaries(rows: StudentSummary[], query: string, show: StudentShow): StudentSummary[] {
  const q = query.trim().toLowerCase()
  return rows.filter((r) => {
    if (q && !r.student.name.toLowerCase().includes(q)) return false
    if (show === 'in-progress') return r.counts.inProgress > 0
    if (show === 'flagged') return r.notes.length > 0
    return true
  })
}

export function academicLabel(counts: StatusCounts): string {
  const parts = [
    counts.inProgress ? `${counts.inProgress} in progress` : '',
    counts.completed ? `${counts.completed} completed` : '',
    counts.notStarted ? `${counts.notStarted} not started` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'No tasks yet'
}

/** The most recent event for each task id. */
export function latestEventByTask(events: EvidenceEvent[]): Record<string, EvidenceEvent> {
  const map: Record<string, EvidenceEvent> = {}
  for (const e of events) {
    const current = map[e.taskId]
    if (!current || Date.parse(e.occurredAt) > Date.parse(current.occurredAt)) map[e.taskId] = e
  }
  return map
}

// ---- Activities -----------------------------------------------------------

/** Students' tasks grouped by the activity they came from. */
export function tasksByActivity(tasks: Task[]): Record<string, Task[]> {
  const map: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!map[task.activityId]) map[task.activityId] = []
    map[task.activityId].push(task)
  }
  return map
}

// ---- Evidence feed ----------------------------------------------------------

export interface FeedItem {
  id: string
  at: string
  studentId: string
  taskId?: string
  kind: EvidenceKind
  /** Dimensions this item is linked to: via signals for events, or the observation's own dimension. */
  dimensions: DevelopmentDimension[]
  event?: EvidenceEvent
  observation?: TeacherObservation
}

/** Events and teacher observations in one list, newest first. */
export function buildFeed(
  events: EvidenceEvent[],
  observations: TeacherObservation[],
  signals: DevelopmentSignal[],
): FeedItem[] {
  const dims = dimensionsByEvent(signals)
  const items: FeedItem[] = [
    ...events.map<FeedItem>((event) => ({
      id: event.id,
      at: event.occurredAt,
      studentId: event.studentId,
      taskId: event.taskId,
      kind: event.type,
      dimensions: dims[event.id] ?? [],
      event,
    })),
    ...observations.map<FeedItem>((observation) => ({
      id: observation.id,
      at: observation.createdAt,
      studentId: observation.studentId,
      taskId: observation.taskId,
      kind: 'teacher-observation',
      dimensions: observation.dimension ? [observation.dimension] : [],
      observation,
    })),
  ]
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

/** Empty string means "no filter" for each field. */
export interface FeedFilters {
  student: string
  activity: string
  dimension: string
  type: string
}

export const NO_FEED_FILTERS: FeedFilters = { student: '', activity: '', dimension: '', type: '' }

export function filterFeed(items: FeedItem[], filters: FeedFilters, activityByTask: Record<string, string>): FeedItem[] {
  return items.filter((item) => {
    if (filters.student && item.studentId !== filters.student) return false
    if (filters.activity && (!item.taskId || activityByTask[item.taskId] !== filters.activity)) return false
    if (filters.dimension && !item.dimensions.includes(filters.dimension as DevelopmentDimension)) return false
    if (filters.type && item.kind !== filters.type) return false
    return true
  })
}
