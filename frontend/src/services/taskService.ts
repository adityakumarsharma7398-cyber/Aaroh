// Service boundary (see studentService.ts).
//
// REAL (backend API, current student): listMyTasks, getMyCurrentTask, getTask, listAttempts, saveAttempt, completeTask
// MOCK (teacher scope, not integrated yet): listTasks, getCurrentTask, listAllTasks
import { copy, db } from '../data/mock/store'
import type { Task, TaskAttempt } from '../types/domain'
import { ApiError, apiClient } from './apiClient'
import { mapAttempt, mapList, mapTask } from './contracts/mappers'
import { studentService } from './studentService'

const taskPath = (taskId: string) => `/tasks/${encodeURIComponent(taskId)}`

async function currentStudentId(): Promise<string> {
  return (await studentService.getCurrentStudent()).id
}

/** A 404 means "no such task for the UI": pages show their not-found state. Everything else is a real failure. */
async function orUndefinedIfMissing<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not-found') return undefined
    throw error
  }
}

function detailOf(raw: unknown): { task: unknown; attempts: unknown } {
  if (raw === null || typeof raw !== 'object') throw new Error('task detail: expected an object')
  return raw as { task: unknown; attempts: unknown }
}

export const taskService = {
  /** GET /student/tasks. Status is derived by the backend from the student's events. */
  async listMyTasks(): Promise<Task[]> {
    const studentId = await currentStudentId()
    return apiClient.get('/student/tasks', { parse: (d) => mapList(d, (t) => mapTask(t, studentId)) })
  },

  /** GET /student/tasks/current. Undefined when nothing is left to work on. */
  async getMyCurrentTask(): Promise<Task | undefined> {
    const studentId = await currentStudentId()
    return apiClient.get('/student/tasks/current', {
      parse: (d) => (d === null || d === undefined ? undefined : mapTask(d, studentId)),
    })
  },

  /** GET /tasks/:taskId. Undefined if the task does not exist. */
  async getTask(taskId: string): Promise<Task | undefined> {
    const studentId = await currentStudentId()
    return orUndefinedIfMissing(apiClient.get(taskPath(taskId), { parse: (d) => mapTask(detailOf(d).task, studentId) }))
  },

  /** The student's own attempts on a task, newest first (from the same GET /tasks/:taskId). */
  async listAttempts(taskId: string): Promise<TaskAttempt[]> {
    const attempts = await orUndefinedIfMissing(
      apiClient.get(taskPath(taskId), { parse: (d) => mapList(detailOf(d).attempts, mapAttempt) }),
    )
    return attempts ?? []
  },

  /**
   * POST /tasks/:taskId/attempts { content }. The backend records an `attempt`, or a `retry` if one already exists,
   * so the same call serves both. The client never chooses the event type.
   */
  async saveAttempt(taskId: string, content: string): Promise<TaskAttempt> {
    return apiClient.post(`${taskPath(taskId)}/attempts`, { body: { content }, parse: mapAttempt })
  },

  /** POST /tasks/:taskId/complete {}. Returns the task as the backend now sees it. */
  async completeTask(taskId: string): Promise<Task> {
    await apiClient.post(`${taskPath(taskId)}/complete`, { body: {} })
    const task = await taskService.getTask(taskId)
    if (!task) throw new ApiError('unexpected-response')
    return task
  },

  /** MOCK. Teacher scope. */
  async listTasks(studentId: string): Promise<Task[]> {
    return copy(db.tasks.filter((t) => t.studentId === studentId))
  },

  /** MOCK. Teacher scope. */
  async getCurrentTask(studentId: string): Promise<Task | undefined> {
    const mine = db.tasks.filter((t) => t.studentId === studentId)
    return copy(mine.find((t) => t.status === 'in-progress') ?? mine.find((t) => t.status === 'not-started'))
  },

  /** MOCK. Teacher scope: every student's tasks. */
  async listAllTasks(): Promise<Task[]> {
    return copy(db.tasks)
  },
}
