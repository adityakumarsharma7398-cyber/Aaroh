// Service boundary: UI talks to this module, never to mock data or the network directly.
// To go live, replace the bodies with calls to the API client; signatures stay the same.
import { deriveAttentionNotes } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { AttentionNote, Student } from '../types/domain'

export const studentService = {
  /** The signed-in student. The real implementation will resolve this from the session. */
  async getCurrentStudent(): Promise<Student> {
    return copy(db.students.find((s) => s.id === db.studentId) ?? db.students[0])
  },

  /** Teacher scope: every student the teacher works with. */
  async listStudents(): Promise<Student[]> {
    return copy(db.students)
  },

  async getStudent(studentId: string): Promise<Student | undefined> {
    return copy(db.students.find((s) => s.id === studentId))
  },

  /**
   * Teacher scope: prompts to look closer at a student (little evidence, repeated difficulty, inactive work,
   * no teacher note yet). Derived by the backend; they are conversation starters, not judgements.
   */
  async listAttentionNotes(): Promise<AttentionNote[]> {
    return deriveAttentionNotes()
  },
}
