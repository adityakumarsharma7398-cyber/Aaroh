// Data hooks for the student pages. Each one is a thin composition of service calls.
// Pages never import services directly for reads; they use these hooks.
// A hook resolves to `undefined` when the requested entity does not exist (the backend answered 404).
// Failures (401, 403, network, server) are NOT swallowed: they reach the page as an error state.
import { useAsyncData } from '../../hooks/useAsyncData'
import { titlesById } from '../../lib/tasks'
import { evidenceService } from '../../services/evidenceService'
import { growthService } from '../../services/growthService'
import { mentorService } from '../../services/mentorService'
import { missionService } from '../../services/missionService'
import { reflectionService } from '../../services/reflectionService'
import { taskService } from '../../services/taskService'
import { isDevelopmentDimension } from '../../types/domain'

// ---- Tasks ---------------------------------------------------------------

export function useTaskWorkspaceData(taskId: string) {
  return useAsyncData(async () => {
    // Started together so the task detail (which carries the attempts) is requested once, not twice.
    const [task, attempts, mission] = await Promise.all([
      taskService.getTask(taskId),
      taskService.listAttempts(taskId),
      missionService.getMissionForTask(taskId),
    ])
    if (!task) return undefined
    return { task, attempts, mission }
  }, taskId)
}

export function useMentorData(taskId: string) {
  return useAsyncData(async () => {
    const [task, session, attempts] = await Promise.all([
      taskService.getTask(taskId),
      mentorService.getSession(taskId),
      taskService.listAttempts(taskId),
    ])
    if (!task) return undefined
    return { task, session, attempts }
  }, taskId)
}

export function useCompletionData(taskId: string) {
  return useAsyncData(async () => {
    const [task, events, attempts] = await Promise.all([
      taskService.getTask(taskId),
      evidenceService.listMyEventsForTask(taskId),
      taskService.listAttempts(taskId),
    ])
    if (!task) return undefined
    return { task, events, attempts }
  }, taskId)
}

export function useReflectionData(taskId: string) {
  return useAsyncData(async () => {
    const [task, prompts, reflection, mission] = await Promise.all([
      taskService.getTask(taskId),
      reflectionService.getPrompts(),
      reflectionService.getReflection(taskId),
      missionService.getMissionForTask(taskId),
    ])
    if (!task) return undefined
    return { task, prompts, reflection, mission }
  }, taskId)
}

// ---- Missions ------------------------------------------------------------

export function useMissionsData() {
  return useAsyncData(async () => {
    const [missions, tasks] = await Promise.all([missionService.listMissions(), taskService.listMyTasks()])
    return { missions, taskTitles: titlesById(tasks) }
  })
}

export function useMissionData(missionId: string) {
  return useAsyncData(async () => {
    const mission = await missionService.getMission(missionId)
    if (!mission) return undefined
    const [task, attempts, events] = await Promise.all([
      taskService.getTask(mission.taskId),
      missionService.listAttempts(missionId),
      evidenceService.listMyEventsForMission(missionId),
    ])
    return { mission, task, attempts, events }
  }, missionId)
}

// ---- Growth --------------------------------------------------------------

export function useGrowthData() {
  return useAsyncData(async () => {
    const [signals, insight] = await Promise.all([growthService.listMySignals(), growthService.getMyInsight()])
    return { signals, insight }
  })
}

export function useEvidenceData() {
  return useAsyncData(async () => {
    const [events, tasks, signals, evidence] = await Promise.all([
      evidenceService.listMyEvents(),
      taskService.listMyTasks(),
      growthService.listMySignals(),
      evidenceService.listMyEvidenceRecords(),
    ])
    return { events, taskTitles: titlesById(tasks), signals, evidence }
  })
}

export function useDimensionData(dimension: string) {
  return useAsyncData(async () => {
    if (!isDevelopmentDimension(dimension)) return undefined
    const signal = await growthService.getMySignal(dimension)
    const [events, tasks, missions] = await Promise.all([
      evidenceService.listMyEventsByIds(signal?.evidenceEventIds ?? []),
      taskService.listMyTasks(),
      missionService.listMissions(),
    ])
    return {
      dimension,
      signal,
      events,
      taskTitles: titlesById(tasks),
      tasks: tasks.filter((t) => t.opportunities.some((o) => o.dimension === dimension)),
      completedMissions: missions.filter((m) => m.dimension === dimension && m.status === 'completed'),
    }
  }, dimension)
}
