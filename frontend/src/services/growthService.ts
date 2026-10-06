// Service boundary (see studentService.ts).
//
// REAL (current student): listMySignals, getMySignal, getMyInsight
// MOCK (teacher scope, not integrated yet): listSignals, listAllSignals, listGroupSignals
//
// Signals and insights are derived from evidence by the backend's deterministic engine. The frontend only reads
// them (and translates wording in contracts/mappers.ts). It never calculates a signal.
import { deriveGroupSignals } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { DevelopmentDimension, DevelopmentSignal, GroupSignal, GrowthInsight } from '../types/domain'
import { apiClient } from './apiClient'
import { mapInsight, mapList, mapSignal } from './contracts/mappers'

export const growthService = {
  /**
   * GET /student/signals. The backend returns all five dimensions; those with insufficient data are omitted here,
   * so the UI shows "Not enough evidence yet" for them instead of inventing a signal.
   */
  async listMySignals(): Promise<DevelopmentSignal[]> {
    return apiClient.get('/student/signals', { parse: (d) => mapList(d, mapSignal) })
  },

  /** Undefined when there is not yet enough evidence for this dimension. */
  async getMySignal(dimension: DevelopmentDimension): Promise<DevelopmentSignal | undefined> {
    return (await growthService.listMySignals()).find((s) => s.dimension === dimension)
  },

  /** GET /student/insight: an observation grounded in the student's recorded evidence. */
  async getMyInsight(): Promise<GrowthInsight | undefined> {
    return apiClient.get('/student/insight', { parse: mapInsight })
  },

  /** MOCK. Teacher scope: one student's signals. */
  async listSignals(studentId: string): Promise<DevelopmentSignal[]> {
    return copy(db.signals.filter((s) => s.studentId === studentId))
  },

  /** MOCK. Teacher scope: every student's signals. */
  async listAllSignals(): Promise<DevelopmentSignal[]> {
    return copy(db.signals)
  },

  /** MOCK. Teacher scope: one qualitative group-level summary per dimension. */
  async listGroupSignals(): Promise<GroupSignal[]> {
    return deriveGroupSignals()
  },
}
