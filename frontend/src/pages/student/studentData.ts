// Data hooks for the student pages. Each one is a thin composition of service calls.
// Pages never import services or mock data directly for reads; they use these hooks.
// A hook resolves to `undefined` when the requested entity does not exist.
import { useAsyncData } from '../../hooks/useAsyncData'
import { evidenceService } from '../../services/evidenceService'
import { growthService } from '../../services/growthService'
import { mentorService } from '../../services/mentorService'
import { missionService } from '../../services/missionService'
import { reflectionService } from '../../services/reflectionService'
import { studentService } from '../../services/studentService'
import { taskService } from '../../services/taskService'
import { titlesById } from '../../lib/tasks'
import { isDevelopmentDimension } from '../../types/domain'

async function currentStudentId(): Promise<string> {
  return (await studentService.getCurrentStudent()).id
}

// ---- Tasks ---------------------------------------------------------------

export function useTaskWorkspaceData(taskId: string) {
  return useAsyncData(async () => {
    const task = await taskService.getTask(taskId)
    if (!task) return undefined
    const [attempts, mission] = await Promise.all([
      taskService.listAttempts(taskId),
      missionService.getMissionForTask(taskId),
    ])
    return { task, attempts, mission }
  }, taskId)
}

export function useMentorData(taskId: string) {
  return useAsyncData(async () => {
    const task = await taskService.getTask(taskId)
    if (!task) return undefined
    const [session, attempts] = await Promise.all([mentorService.getSession(taskId), taskService.listAttempts(taskId)])
    return { task, session, attempts }
  }, taskId)
}

export function useCompletionData(taskId: string) {
  return useAsyncData(async () => {
    const task = await taskService.getTask(taskId)
    if (!task) return undefined
    const [events, attempts] = await Promise.all([
      evidenceService.listEventsForTask(taskId),
      taskService.listAttempts(taskId),
    ])
    return { task, events, attempts }
  }, taskId)
}

export function useReflectionData(taskId: string) {
  return useAsyncData(async () => {
    const task = await taskService.getTask(taskId)
    if (!task) return undefined
    const [prompts, reflection, mission] = await Promise.all([
      reflectionService.getPrompts(taskId),
      reflectionService.getReflection(taskId),
      missionService.getMissionForTask(taskId),
    ])
    return { task, prompts, reflection, mission }
  }, taskId)
}

// ---- Missions ------------------------------------------------------------

export function useMissionsData() {
  return useAsyncData(async () => {
    const studentId = await currentStudentId()
    const [missions, tasks] = await Promise.all([missionService.listMissions(studentId), taskService.listTasks(studentId)])
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
      evidenceService.listEventsForMission(missionId),
    ])
    return { mission, task, attempts, events }
  }, missionId)
}

// ---- Growth --------------------------------------------------------------

export function useGrowthData() {
  return useAsyncData(async () => {
    const studentId = await currentStudentId()
    const [signals, insight] = await Promise.all([
      growthService.listSignals(studentId),
      growthService.getLatestInsight(studentId),
    ])
    return { signals, insight }
  })
}

export function useEvidenceData() {
  return useAsyncData(async () => {
    const studentId = await currentStudentId()
    const [events, tasks, signals] = await Promise.all([
      evidenceService.listEvents(studentId),
      taskService.listTasks(studentId),
      growthService.listSignals(studentId),
    ])
    return { events, taskTitles: titlesById(tasks), signals }
  })
}

export function useDimensionData(dimension: string) {
  return useAsyncData(async () => {
    if (!isDevelopmentDimension(dimension)) return undefined
    const studentId = await currentStudentId()
    const signal = await growthService.getSignal(studentId, dimension)
    const [events, tasks, missions] = await Promise.all([
      evidenceService.listEventsByIds(signal?.evidenceEventIds ?? []),
      taskService.listTasks(studentId),
      missionService.listMissions(studentId),
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
