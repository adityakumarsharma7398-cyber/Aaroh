// Service boundary (see studentService.ts).
//
// REAL (current student): listMy* , derived from GET /student/events and GET /student/evidence
// MOCK (teacher scope, not integrated yet): listEvents, listAllEvents
//
// The backend records events as a side effect of student actions. The frontend only reads them.
import { copy, db } from '../data/mock/store'
import type { EvidenceEvent, EvidenceRecord } from '../types/domain'
import { apiClient } from './apiClient'
import { mapEvent, mapEvidenceRecord, mapList } from './contracts/mappers'

const byNewest = (a: EvidenceEvent, b: EvidenceEvent) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)

/** GET /student/events, mapped to UI events. Backend events with no UI equivalent are dropped. Newest first. */
async function loadMyEvents(): Promise<EvidenceEvent[]> {
  const events = await apiClient.get('/student/events', { parse: (d) => mapList(d, mapEvent) })
  return events.sort(byNewest)
}

export const evidenceService = {
  async listMyEvents(): Promise<EvidenceEvent[]> {
    return loadMyEvents()
  },

  /** Most recent first. */
  async listMyRecentEvents(limit = 5): Promise<EvidenceEvent[]> {
    return (await loadMyEvents()).slice(0, limit)
  },

  async listMyEventsForTask(taskId: string): Promise<EvidenceEvent[]> {
    return (await loadMyEvents()).filter((e) => e.taskId === taskId)
  },

  async listMyEventsForMission(missionId: string): Promise<EvidenceEvent[]> {
    return (await loadMyEvents()).filter((e) => e.missionId === missionId)
  },

  async listMyEventsByIds(ids: string[]): Promise<EvidenceEvent[]> {
    return (await loadMyEvents()).filter((e) => ids.includes(e.id))
  },

  /** GET /student/evidence: evidence the backend derived from the student's events, with the events it rests on. */
  async listMyEvidenceRecords(): Promise<EvidenceRecord[]> {
    return apiClient.get('/student/evidence', { parse: (d) => mapList(d, mapEvidenceRecord) })
  },

  /** MOCK. Teacher scope: one student's events, newest first. */
  async listEvents(studentId: string): Promise<EvidenceEvent[]> {
    return copy(db.events.filter((e) => e.studentId === studentId).sort(byNewest))
  },

  /** MOCK. Teacher scope: every student's events, newest first. */
  async listAllEvents(): Promise<EvidenceEvent[]> {
    return copy([...db.events].sort(byNewest))
  },
}
