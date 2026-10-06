// Service boundary (see taskService.ts). Currently backed by the mock backend.
// Evidence is created by the backend as a side effect of student actions; the UI only reads it.
import { copy, db } from '../data/mock/store'
import type { EvidenceEvent } from '../types/domain'

const byNewest = (a: EvidenceEvent, b: EvidenceEvent) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)

export const evidenceService = {
  /** All of the student's events, newest first. */
  async listEvents(studentId: string): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => e.studentId === studentId).sort(byNewest))
  },

  /** Teacher scope: every student's events, newest first. */
  async listAllEvents(): Promise<EvidenceEvent[]> {
    return copy([...db.events].sort(byNewest))
  },

  /** Most recent first. */
  async listRecentEvents(studentId: string, limit = 5): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => e.studentId === studentId).sort(byNewest).slice(0, limit))
  },

  async listEventsForTask(taskId: string): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => e.taskId === taskId).sort(byNewest))
  },

  async listEventsForMission(missionId: string): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => e.missionId === missionId).sort(byNewest))
  },

  async listEventsByIds(ids: string[]): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => ids.includes(e.id)).sort(byNewest))
  },
}
