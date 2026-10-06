// Pure view helpers for task lists. Retrieval stays in taskService; this only
// shapes data that is already loaded (filtering and ordering for display).
import type { Task, TaskStatus } from '../types/domain'

export type StatusFilter = 'all' | 'not-started' | 'in-progress' | 'completed'
export type SubjectFilter = 'all' | string

/** A submitted task is finished from the student's side, so it sits under "Completed". */
const FILTER_STATUSES: Record<Exclude<StatusFilter, 'all'>, TaskStatus[]> = {
  'not-started': ['not-started'],
  'in-progress': ['in-progress'],
  completed: ['submitted', 'completed'],
}

export function matchesStatusFilter(task: Task, filter: StatusFilter): boolean {
  return filter === 'all' || FILTER_STATUSES[filter].includes(task.status)
}

export function filterTasks(tasks: Task[], status: StatusFilter, subject: SubjectFilter): Task[] {
  return tasks.filter((t) => matchesStatusFilter(t, status) && (subject === 'all' || t.subject === subject))
}

export function countByStatusFilter(tasks: Task[], filter: StatusFilter): number {
  return tasks.filter((t) => matchesStatusFilter(t, filter)).length
}

export function listSubjects(tasks: Task[]): string[] {
  return [...new Set(tasks.map((t) => t.subject))].sort((a, b) => a.localeCompare(b))
}

const FOCUS_ORDER: Record<TaskStatus, number> = {
  'in-progress': 0,
  'not-started': 1,
  submitted: 2,
  completed: 3,
}

/** Open work first, finished work last. Stable within each group. */
export function sortByFocus(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => FOCUS_ORDER[a.status] - FOCUS_ORDER[b.status])
}

/** Task titles by task id, for labelling events and observations. */
export function titlesById(tasks: Task[]): Record<string, string> {
  return Object.fromEntries(tasks.map((t) => [t.id, t.title]))
}
