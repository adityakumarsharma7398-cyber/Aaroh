// Service boundary (see taskService.ts). Currently backed by the mock backend.
// Signals and insights are derived from evidence by the backend; the frontend only reads them.
import { deriveGroupSignals } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { DevelopmentDimension, DevelopmentSignal, GroupSignal, GrowthInsight } from '../types/domain'

export const growthService = {
  async listSignals(studentId: string): Promise<DevelopmentSignal[]> {
    return copy(db.signals.filter((s) => s.studentId === studentId))
  },

  /** Undefined when there is not yet enough evidence for this dimension. */
  async getSignal(studentId: string, dimension: DevelopmentDimension): Promise<DevelopmentSignal | undefined> {
    return copy(db.signals.find((s) => s.studentId === studentId && s.dimension === dimension))
  },

  async getLatestInsight(studentId: string): Promise<GrowthInsight | undefined> {
    return copy(db.insights.find((i) => i.studentId === studentId))
  },

  /** Teacher scope: every student's signals. */
  async listAllSignals(): Promise<DevelopmentSignal[]> {
    return copy(db.signals)
  },

  /** Teacher scope: one qualitative group-level summary per dimension. Built by the backend. */
  async listGroupSignals(): Promise<GroupSignal[]> {
    return deriveGroupSignals()
  },
}
