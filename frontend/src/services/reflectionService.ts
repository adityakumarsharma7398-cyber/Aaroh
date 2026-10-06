// Service boundary (see taskService.ts). Currently backed by the mock backend.
// Reflections are stored as typed data only; no analysis happens in the frontend.
import { recordReflection } from '../data/mock/mockBackend'
import { REFLECTION_PROMPTS } from '../data/mock/mockContent'
import { copy, db } from '../data/mock/store'
import type { Reflection, ReflectionAnswer } from '../types/domain'

export const reflectionService = {
  /** Prompts for a task. The backend may personalise these later. */
  async getPrompts(taskId: string): Promise<string[]> {
    return db.tasks.some((t) => t.id === taskId) ? [...REFLECTION_PROMPTS] : []
  },

  async getReflection(taskId: string): Promise<Reflection | undefined> {
    return copy(db.reflections.find((r) => r.taskId === taskId))
  },

  async submitReflection(taskId: string, answers: ReflectionAnswer[]): Promise<Reflection> {
    return recordReflection(taskId, answers)
  },
}
