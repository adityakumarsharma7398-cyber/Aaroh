// Service boundary (see studentService.ts). Currently backed by the mock backend.
// Observations are teacher-provided context. The backend decides whether and how they influence
// development signals; the frontend never turns them into a score.
import { recordObservation } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { ObservationInput, TeacherObservation } from '../types/domain'

const byNewest = (a: TeacherObservation, b: TeacherObservation) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

export const teacherObservationService = {
  /** Newest first. Pass a student id to see one student's observations. */
  async listObservations(studentId?: string): Promise<TeacherObservation[]> {
    return copy(db.observations.filter((o) => !studentId || o.studentId === studentId).sort(byNewest))
  },

  async createObservation(input: ObservationInput): Promise<TeacherObservation> {
    return recordObservation(input)
  },
}
