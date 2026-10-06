// Service boundary for the mentor. REAL (current student).
//
// SECURITY: the SERVER decides which hint level is granted next, from the student's own hint history.
// The client sends ONLY the task id. It never sends, and is never trusted with, a level (no `level`, `hintLevel`
// or `requestedLevel`): the backend rejects those with 400 UNAUTHORIZED_HINT_LEVEL.
import type { MentorHint, MentorSession } from '../types/domain'
import { apiClient } from './apiClient'
import { mapMentorHint, mapMentorSession } from './contracts/mappers'

export const mentorService = {
  /** GET /tasks/:taskId/mentor: the hints already granted for this task and the current level. */
  async getSession(taskId: string): Promise<MentorSession> {
    return apiClient.get(`/tasks/${encodeURIComponent(taskId)}/mentor`, { parse: mapMentorSession })
  },

  /** POST /hint { taskId }. Returns the hint the server granted, including the level it chose. */
  async requestHint(taskId: string): Promise<MentorHint> {
    return apiClient.post('/hint', { body: { taskId }, parse: mapMentorHint })
  },
}
