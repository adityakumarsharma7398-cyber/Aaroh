// Service boundary (see studentService.ts). All methods are REAL and current-student scoped.
//
// There is no "get one mission" or "list mission attempts" endpoint, so those are derived from what exists:
//  - a single mission / a task's mission come from GET /student/missions
//  - mission attempts come from the student's own events (the backend records a completed mission as a
//    `completed` event whose metadata carries the mission id and note)
import type { Mission, MissionAttempt } from '../types/domain'
import { ApiError, apiClient } from './apiClient'
import { mapList, mapMission, mapMissionAttempt } from './contracts/mappers'

const missionPath = (missionId: string) => `/student/missions/${encodeURIComponent(missionId)}`

export const missionService = {
  /** GET /student/missions */
  async listMissions(): Promise<Mission[]> {
    return apiClient.get('/student/missions', { parse: (d) => mapList(d, mapMission) })
  },

  async getMission(missionId: string): Promise<Mission | undefined> {
    return (await missionService.listMissions()).find((m) => m.id === missionId)
  },

  /** GET /student/missions/current. The backend may return a completed mission when none is active. */
  async getCurrentMission(): Promise<Mission | undefined> {
    return apiClient.get('/student/missions/current', {
      parse: (d) => (d === null || d === undefined ? undefined : mapMission(d)),
    })
  },

  /** The mission connected to a task, if one exists. */
  async getMissionForTask(taskId: string): Promise<Mission | undefined> {
    return (await missionService.listMissions()).find((m) => m.taskId === taskId)
  },

  /** Recorded attempts for a mission, newest first (derived from GET /student/events). */
  async listAttempts(missionId: string): Promise<MissionAttempt[]> {
    const attempts = await apiClient.get('/student/events', { parse: (d) => mapList(d, mapMissionAttempt) })
    return attempts
      .filter((a) => a.missionId === missionId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  },

  /** POST /student/missions/:missionId/attempts { note }. Returns the attempt as recorded. */
  async recordAttempt(missionId: string, note: string): Promise<MissionAttempt> {
    await apiClient.post(`${missionPath(missionId)}/attempts`, { body: { note } })
    const [latest] = await missionService.listAttempts(missionId)
    if (!latest) throw new ApiError('unexpected-response')
    return latest
  },
}
