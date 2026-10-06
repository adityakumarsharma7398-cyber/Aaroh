// Service boundary (see taskService.ts). Currently backed by the mock backend.
import { recordMissionAttempt } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { Mission, MissionAttempt } from '../types/domain'

export const missionService = {
  async listMissions(studentId: string): Promise<Mission[]> {
    return copy(db.missions.filter((m) => m.studentId === studentId))
  },

  async getMission(missionId: string): Promise<Mission | undefined> {
    return copy(db.missions.find((m) => m.id === missionId))
  },

  /** The mission to put in front of the student now: an active one, otherwise the first recommended one. */
  async getCurrentMission(studentId: string): Promise<Mission | undefined> {
    const mine = db.missions.filter((m) => m.studentId === studentId)
    return copy(mine.find((m) => m.status === 'active') ?? mine.find((m) => m.status === 'available'))
  },

  /** The mission connected to a task, if one exists. */
  async getMissionForTask(taskId: string): Promise<Mission | undefined> {
    return copy(db.missions.find((m) => m.taskId === taskId))
  },

  /** Recorded attempts for a mission, newest first. */
  async listAttempts(missionId: string): Promise<MissionAttempt[]> {
    return copy(
      db.missionAttempts
        .filter((a) => a.missionId === missionId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    )
  },

  /** Records the practical action. The backend turns it into an evidence event. */
  async recordAttempt(missionId: string, note: string): Promise<MissionAttempt> {
    return recordMissionAttempt(missionId, note)
  },
}
