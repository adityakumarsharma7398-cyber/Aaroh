// Service boundary: UI talks to this module, never to mock data or the network directly.
// To go live, replace the bodies with calls to the API client; signatures stay the same.
import { completeTask, recordAttempt } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { Task, TaskAttempt } from '../types/domain'

export const taskService = {
  async listTasks(studentId: string): Promise<Task[]> {
    return copy(db.tasks.filter((t) => t.studentId === studentId))
  },

  /** Teacher scope: every student's tasks. */
  async listAllTasks(): Promise<Task[]> {
    return copy(db.tasks)
  },

  async getTask(taskId: string): Promise<Task | undefined> {
    return copy(db.tasks.find((t) => t.id === taskId))
  },

  /** The task the student should focus on now: work already under way first, then the next unstarted task. */
  async getCurrentTask(studentId: string): Promise<Task | undefined> {
    const mine = db.tasks.filter((t) => t.studentId === studentId)
    return copy(mine.find((t) => t.status === 'in-progress') ?? mine.find((t) => t.status === 'not-started'))
  },

  /** Saved attempts for a task, newest first. */
  async listAttempts(taskId: string): Promise<TaskAttempt[]> {
    return copy(
      db.attempts
        .filter((a) => a.taskId === taskId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    )
  },

  /** Saves the student's work. The backend records it as an observable evidence event. */
  async saveAttempt(taskId: string, content: string): Promise<TaskAttempt> {
    return recordAttempt(taskId, content)
  },

  async completeTask(taskId: string): Promise<Task> {
    return completeTask(taskId)
  },
}
