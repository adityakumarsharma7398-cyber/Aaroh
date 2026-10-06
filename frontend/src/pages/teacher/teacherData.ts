// Data hooks for the teacher pages. Each one is a thin composition of service calls.
// Pages never import services or mock data directly for reads; they use these hooks.
// A hook resolves to `undefined` when the requested entity does not exist.
import { useAsyncData } from '../../hooks/useAsyncData'
import { titlesById } from '../../lib/tasks'
import { activityService } from '../../services/activityService'
import { evidenceService } from '../../services/evidenceService'
import { growthService } from '../../services/growthService'
import { studentService } from '../../services/studentService'
import { taskService } from '../../services/taskService'
import { teacherObservationService } from '../../services/teacherObservationService'
import type { Student } from '../../types/domain'

function namesById(students: Student[]): Record<string, string> {
  return Object.fromEntries(students.map((s) => [s.id, s.name]))
}

export function useOverviewData() {
  return useAsyncData(async () => {
    const [students, tasks, events, signals, groupSignals, notes, observations] = await Promise.all([
      studentService.listStudents(),
      taskService.listAllTasks(),
      evidenceService.listAllEvents(),
      growthService.listAllSignals(),
      growthService.listGroupSignals(),
      studentService.listAttentionNotes(),
      teacherObservationService.listObservations(),
    ])
    return {
      students,
      tasks,
      events,
      signals,
      groupSignals,
      notes,
      observations,
      studentNames: namesById(students),
      taskTitles: titlesById(tasks),
    }
  })
}

export function useStudentsData() {
  return useAsyncData(async () => {
    const [students, tasks, events, signals, notes] = await Promise.all([
      studentService.listStudents(),
      taskService.listAllTasks(),
      evidenceService.listAllEvents(),
      growthService.listAllSignals(),
      studentService.listAttentionNotes(),
    ])
    // The service decides which task is "current", so the rule is not repeated in the UI.
    const current = await Promise.all(students.map((s) => taskService.getCurrentTask(s.id)))
    const currentTasks = Object.fromEntries(students.map((s, i) => [s.id, current[i]]))
    return { students, tasks, events, signals, notes, currentTasks }
  })
}

export function useStudentDetailData(studentId: string) {
  return useAsyncData(async () => {
    const student = await studentService.getStudent(studentId)
    if (!student) return undefined
    const [tasks, events, signals, observations, notes] = await Promise.all([
      taskService.listTasks(studentId),
      evidenceService.listEvents(studentId),
      growthService.listSignals(studentId),
      teacherObservationService.listObservations(studentId),
      studentService.listAttentionNotes(),
    ])
    return {
      student,
      tasks,
      events,
      signals,
      observations,
      notes: notes.filter((n) => n.studentId === studentId),
      taskTitles: titlesById(tasks),
    }
  }, studentId)
}

export function useActivitiesData() {
  return useAsyncData(async () => {
    const [activities, tasks, students] = await Promise.all([
      activityService.listActivities(),
      taskService.listAllTasks(),
      studentService.listStudents(),
    ])
    return { activities, tasks, studentNames: namesById(students) }
  })
}

export function useGroupSignalsData() {
  return useAsyncData(async () => {
    const [groupSignals, signals, events, students, tasks] = await Promise.all([
      growthService.listGroupSignals(),
      growthService.listAllSignals(),
      evidenceService.listAllEvents(),
      studentService.listStudents(),
      taskService.listAllTasks(),
    ])
    return { groupSignals, signals, events, studentNames: namesById(students), taskTitles: titlesById(tasks) }
  })
}

async function loadEvidenceFeed() {
  const [events, observations, students, tasks, signals, activities] = await Promise.all([
    evidenceService.listAllEvents(),
    teacherObservationService.listObservations(),
    studentService.listStudents(),
    taskService.listAllTasks(),
    growthService.listAllSignals(),
    activityService.listActivities(),
  ])
  return {
    events,
    observations,
    students,
    signals,
    activities,
    studentNames: namesById(students),
    taskTitles: titlesById(tasks),
    activityByTask: Object.fromEntries(tasks.map((t) => [t.id, t.activityId])),
  }
}

export type EvidenceFeedData = Awaited<ReturnType<typeof loadEvidenceFeed>>

export function useEvidenceFeedData() {
  return useAsyncData(loadEvidenceFeed)
}
