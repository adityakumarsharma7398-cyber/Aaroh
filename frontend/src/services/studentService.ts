// Service boundary: UI talks to this module, never to mock data or the network directly.
//
// REAL (backend API, identity from the session):  getCurrentStudent
// MOCK (teacher scope, not integrated yet):        listStudents, getStudent, listAttentionNotes
import { deriveAttentionNotes } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { AttentionNote, Student } from '../types/domain'
import { apiClient } from './apiClient'
import { mapStudent } from './contracts/mappers'

// The signed-in student does not change during a page session, so it is fetched once. A failure is not cached.
let currentStudent: Promise<Student> | undefined

export const studentService = {
  /** GET /student/me. The backend identifies the student from the session; the client never supplies an id. */
  getCurrentStudent(): Promise<Student> {
    if (!currentStudent) {
      currentStudent = apiClient.get('/student/me', { parse: mapStudent }).catch((error: unknown) => {
        currentStudent = undefined
        throw error
      })
    }
    return currentStudent
  },

  /** MOCK. Teacher scope: every student the teacher works with. */
  async listStudents(): Promise<Student[]> {
    return copy(db.students)
  },

  /** MOCK. */
  async getStudent(studentId: string): Promise<Student | undefined> {
    return copy(db.students.find((s) => s.id === studentId))
  },

  /** MOCK. Teacher scope: prompts to look closer at a student. */
  async listAttentionNotes(): Promise<AttentionNote[]> {
    return deriveAttentionNotes()
  },
}
