// MOCK DATABASE: a mutable, in-memory stand-in for the real database.
// State lives only for the page session (a full reload restores the seed data).
// Only src/services/* and src/data/mock/mockBackend.ts may import this.
import { seedHints } from './mockContent'
import { mockStudents, mockTeachers } from './people'
import {
  mockActivities,
  mockAttempts,
  mockEvidenceEvents,
  mockInsights,
  mockMissionAttempts,
  mockMissions,
  mockObservations,
  mockReflections,
  mockSignals,
  mockTasks,
} from './work'

export const db = {
  /** The signed-in student and teacher. Real auth will provide these later. */
  studentId: mockStudents[0].id,
  teacherId: mockTeachers[0].id,
  students: structuredClone(mockStudents),
  activities: structuredClone(mockActivities),
  tasks: structuredClone(mockTasks),
  attempts: structuredClone(mockAttempts),
  missions: structuredClone(mockMissions),
  missionAttempts: structuredClone(mockMissionAttempts),
  hints: structuredClone(seedHints),
  reflections: structuredClone(mockReflections),
  events: structuredClone(mockEvidenceEvents),
  signals: structuredClone(mockSignals),
  insights: structuredClone(mockInsights),
  observations: structuredClone(mockObservations),
}

let counter = 0
export function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Services hand copies to the UI so it can never mutate the "database" by accident. */
export function copy<T>(value: T): T {
  return structuredClone(value)
}
