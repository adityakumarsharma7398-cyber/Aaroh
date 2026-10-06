// MOCK BACKEND RULES: behaviour the real backend will own.
// Services call these where they will later call the API. The UI never imports this file.
//
// What the "backend" decides here (not the UI):
//  - saving an attempt is recorded as an observable event, and starts a not-started task
//  - guidance steps up exactly one level at a time
//  - completing a task / mission is recorded once
// It never interprets events as character traits; that is the evidence engine's job.
import { copy, db, nextId, nowIso } from './store'
import { hintContent } from './mockContent'
import {
  DEVELOPMENT_DIMENSIONS,
  MAX_HINT_LEVEL,
  isDevelopmentDimension,
  type Activity,
  type ActivityInput,
  type AttentionNote,
  type EvidenceEvent,
  type GroupSignal,
  type ObservationInput,
  type SignalTrend,
  type TeacherObservation,
  type HintLevel,
  type MentorHint,
  type Mission,
  type MissionAttempt,
  type Reflection,
  type ReflectionAnswer,
  type Task,
  type TaskAttempt,
} from '../../types/domain'

function findTask(taskId: string): Task {
  const task = db.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error(`Task not found: ${taskId}`)
  return task
}

function findMission(missionId: string): Mission {
  const mission = db.missions.find((m) => m.id === missionId)
  if (!mission) throw new Error(`Mission not found: ${missionId}`)
  return mission
}

function addEvent(event: Pick<EvidenceEvent, 'taskId' | 'type' | 'hintLevel' | 'missionId'>): void {
  db.events.push({ id: nextId('ev'), studentId: db.studentId, occurredAt: nowIso(), ...event })
}

export function recordAttempt(taskId: string, content: string): TaskAttempt {
  const task = findTask(taskId)
  if (!content.trim()) throw new Error('An attempt cannot be empty')

  const earlier = db.attempts.filter((a) => a.taskId === taskId).length
  const attempt: TaskAttempt = {
    id: nextId('att'),
    studentId: db.studentId,
    taskId,
    content,
    createdAt: nowIso(),
  }
  db.attempts.push(attempt)
  if (task.status === 'not-started') task.status = 'in-progress'
  // The first saved attempt is an attempt; saving again later is a retry.
  addEvent({ taskId, type: earlier === 0 ? 'attempt-created' : 'retry' })
  return copy(attempt)
}

/**
 * Grants the next hint for a task. The caller does NOT choose a level: the backend works it out from the
 * hints already granted, so guidance can only step up one level at a time.
 */
export function requestHint(taskId: string): MentorHint {
  const task = findTask(taskId)
  const delivered = db.hints.filter((h) => h.taskId === taskId)
  const current = delivered.reduce<HintLevel>((max, h) => (h.level > max ? h.level : max), 0)
  if (current >= MAX_HINT_LEVEL) throw new Error('The final level of guidance has already been given')

  const level = (current + 1) as HintLevel
  const hint: MentorHint = {
    id: `mh-${taskId}-${level}`,
    taskId,
    level,
    content: hintContent(taskId, task.title, task.subject, level),
  }
  db.hints.push(hint)
  addEvent({ taskId, type: 'hint-requested', hintLevel: level })
  return copy(hint)
}

export function completeTask(taskId: string): Task {
  const task = findTask(taskId)
  if (task.status !== 'completed') {
    task.status = 'completed'
    addEvent({ taskId, type: 'task-completed' })
  }
  return copy(task)
}

export function recordReflection(taskId: string, answers: ReflectionAnswer[]): Reflection {
  findTask(taskId)
  const existing = db.reflections.find((r) => r.taskId === taskId)
  if (existing) return copy(existing)

  const given = answers.filter((a) => a.response.trim())
  if (given.length === 0) throw new Error('A reflection needs at least one answer')

  const reflection: Reflection = {
    id: nextId('ref'),
    studentId: db.studentId,
    taskId,
    createdAt: nowIso(),
    answers: given,
  }
  db.reflections.push(reflection)
  addEvent({ taskId, type: 'reflection-added' })
  return copy(reflection)
}

export function recordMissionAttempt(missionId: string, note: string): MissionAttempt {
  const mission = findMission(missionId)
  if (!note.trim()) throw new Error('Describe what you did to record this action')

  const existing = db.missionAttempts.find((a) => a.missionId === missionId)
  if (mission.status === 'completed' && existing) return copy(existing)

  const attempt: MissionAttempt = {
    id: nextId('matt'),
    studentId: db.studentId,
    missionId,
    note,
    createdAt: nowIso(),
  }
  db.missionAttempts.push(attempt)
  mission.status = 'completed'
  addEvent({ taskId: mission.taskId, type: 'mission-completed', missionId })
  return copy(attempt)
}

// ---- Teacher side ---------------------------------------------------------

/** Records a teacher's note. It is stored as-is; it does not change any signal in the browser. */
export function recordObservation(input: ObservationInput): TeacherObservation {
  if (!db.students.some((s) => s.id === input.studentId)) throw new Error(`Student not found: ${input.studentId}`)
  const text = input.text.trim()
  if (!text) throw new Error('An observation needs some text')
  if (input.dimension !== undefined && !isDevelopmentDimension(input.dimension)) {
    throw new Error(`Unknown dimension: ${input.dimension}`)
  }
  if (input.taskId && !db.tasks.some((t) => t.id === input.taskId && t.studentId === input.studentId)) {
    throw new Error('That task does not belong to this student')
  }

  const observation: TeacherObservation = {
    id: nextId('obs'),
    studentId: input.studentId,
    text,
    dimension: input.dimension,
    taskId: input.taskId || undefined,
    createdAt: nowIso(),
  }
  db.observations.push(observation)
  return copy(observation)
}

/** Creates an activity. It is not assigned to any student yet. */
export function createActivity(input: ActivityInput): Activity {
  const title = input.title.trim()
  if (!title) throw new Error('An activity needs a title')
  const activity: Activity = {
    id: nextId('act'),
    title,
    subject: input.subject.trim() || 'General',
    description: input.description.trim(),
    estimatedMinutes: Math.max(5, Math.round(input.estimatedMinutes) || 30),
    opportunities: input.dimensions.map((dimension) => ({ dimension, reason: 'Added by the teacher.' })),
  }
  db.activities.push(activity)
  return copy(activity)
}

const TREND_ORDER: SignalTrend[] = ['improving', 'stable', 'emerging', 'needs-attention']

/**
 * Group-level summary per dimension, built only by counting students' own signals.
 * Rule: with fewer than two students holding a signal there is not enough evidence for a group view;
 * otherwise the most common trend wins and ties fall back to 'stable'.
 * The real backend decides how this is computed; the UI only displays the result.
 */
export function deriveGroupSignals(): GroupSignal[] {
  return DEVELOPMENT_DIMENSIONS.map((dimension) => {
    const signals = db.signals.filter((s) => s.dimension === dimension)
    const studentIds = [...new Set(signals.map((s) => s.studentId))]
    const evidenceEventIds = [...new Set(signals.flatMap((s) => s.evidenceEventIds))]

    if (studentIds.length < 2) {
      const n = studentIds.length
      return {
        dimension,
        summary:
          n === 0
            ? 'No student has a signal for this dimension yet, so there is nothing to summarise.'
            : 'Only one student has a signal for this dimension so far. More evidence is needed before a group view makes sense.',
        studentIds,
        evidenceEventIds,
      }
    }

    const counts = TREND_ORDER.map((trend) => ({ trend, n: signals.filter((s) => s.trend === trend).length }))
    const top = Math.max(...counts.map((c) => c.n))
    const leaders = counts.filter((c) => c.n === top)
    const trend: SignalTrend = leaders.length === 1 ? leaders[0].trend : 'stable'
    const parts = counts.filter((c) => c.n > 0).map((c) => `${c.n} ${c.trend.replace('-', ' ')}`)

    return {
      dimension,
      trend,
      summary: `${studentIds.length} of ${db.students.length} students have a signal here: ${parts.join(', ')}.`,
      studentIds,
      evidenceEventIds,
    }
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Prompts for the teacher to look closer, derived from recorded activity. Thresholds are simple and explicit.
 * "Inactive" is measured against the class's most recent recorded activity, not the wall clock.
 */
export function deriveAttentionNotes(): AttentionNote[] {
  const notes: AttentionNote[] = []
  const latest = Math.max(0, ...db.events.map((e) => Date.parse(e.occurredAt)))

  for (const student of db.students) {
    const events = db.events.filter((e) => e.studentId === student.id)
    const hasWork = db.tasks.some((t) => t.studentId === student.id && t.status === 'in-progress')
    const hasObservation = db.observations.some((o) => o.studentId === student.id)
    const lastAt = events.length ? Math.max(...events.map((e) => Date.parse(e.occurredAt))) : undefined

    if (events.length < 3) {
      notes.push({
        studentId: student.id,
        kind: 'insufficient-evidence',
        detail: `Only ${events.length} recorded ${events.length === 1 ? 'action' : 'actions'} so far, so there is little to go on.`,
      })
    }

    const highHints = events.filter((e) => e.type === 'hint-requested' && (e.hintLevel ?? 0) >= 3)
    if (highHints.length >= 3) {
      const tasks = new Set(highHints.map((e) => e.taskId)).size
      notes.push({
        studentId: student.id,
        kind: 'repeated-difficulty',
        detail: `Level 3 or higher guidance was requested ${highHints.length} times across ${tasks} ${tasks === 1 ? 'task' : 'tasks'}. The work may be hard right now, and a conversation may help.`,
      })
    }

    if (hasWork && lastAt !== undefined && latest - lastAt > 3 * DAY_MS) {
      const days = Math.floor((latest - lastAt) / DAY_MS)
      notes.push({
        studentId: student.id,
        kind: 'inactive-work',
        detail: `A task is in progress, but no activity has been recorded for ${days} days.`,
      })
    }

    if (!hasObservation && events.length >= 5) {
      notes.push({
        studentId: student.id,
        kind: 'observation-needed',
        detail: 'There is recorded evidence but no teacher observation yet. A short note would add context.',
      })
    }
  }
  return notes
}
