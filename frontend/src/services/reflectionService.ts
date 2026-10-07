// Service boundary (see studentService.ts). REAL (current student), except the prompts, which are static UI content.
import { REFLECTION_PROMPTS } from '../content/reflection'
import type { Reflection, ReflectionAnswer } from '../types/domain'
import { apiClient } from './apiClient'
import { mapReflection } from './contracts/mappers'

const reflectionPath = (taskId: string) => `/tasks/${encodeURIComponent(taskId)}/reflection`

export const reflectionService = {
  /** Static: the backend does not serve prompts; it stores each answer together with the prompt it answered. */
  async getPrompts(): Promise<string[]> {
    return [...REFLECTION_PROMPTS]
  },

  /** GET /tasks/:taskId/reflection. Undefined when the student has not reflected on this task. */
  async getReflection(taskId: string): Promise<Reflection | undefined> {
    return apiClient.get(reflectionPath(taskId), { parse: mapReflection })
  },

  /** POST /tasks/:taskId/reflection { answers }. The backend records a `reflection` event. */
  async submitReflection(taskId: string, answers: ReflectionAnswer[]): Promise<Reflection> {
    const saved = await apiClient.post(reflectionPath(taskId), {
      body: { answers },
      parse: (d) => {
        const reflection = mapReflection(d)
        if (!reflection) throw new Error('reflection: empty response')
        return reflection
      },
    })
    return saved
  },
}
