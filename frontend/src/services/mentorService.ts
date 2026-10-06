// Service boundary for the AI mentor.
//
// Contract for the future backend/AI endpoint:
//  - the SERVER decides which hint level is granted next, from the student's own hint history for the task.
//    The client sends only the task; it never sends, and is never trusted with, a level.
//  - the model only writes the content for the level the server grants.
//  - the response states the level that was granted, so the UI can show it.
// Currently backed by canned, illustrative content in the mock backend. No AI is called.
import { requestHint } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { HintLevel, MentorHint, MentorSession } from '../types/domain'

export const mentorService = {
  async getSession(taskId: string): Promise<MentorSession> {
    const hints = db.hints.filter((h) => h.taskId === taskId).sort((a, b) => a.level - b.level)
    const currentLevel = hints.reduce<HintLevel>((max, h) => (h.level > max ? h.level : max), 0)
    return copy({ taskId, currentLevel, hints })
  },

  /** Asks for the next level of guidance. The server picks the level and returns the hint it granted. */
  async requestHint(taskId: string): Promise<MentorHint> {
    return requestHint(taskId)
  },
}
