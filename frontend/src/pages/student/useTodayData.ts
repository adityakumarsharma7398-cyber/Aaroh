import { useAsyncData } from '../../hooks/useAsyncData'
import { evidenceService } from '../../services/evidenceService'
import { growthService } from '../../services/growthService'
import { missionService } from '../../services/missionService'
import { studentService } from '../../services/studentService'
import { taskService } from '../../services/taskService'
import type { DevelopmentSignal, EvidenceEvent, GrowthInsight, Mission, Student, Task } from '../../types/domain'

export interface TodayData {
  student: Student
  task?: Task
  mission?: Mission
  events: EvidenceEvent[]
  signals: DevelopmentSignal[]
  insight?: GrowthInsight
}

async function loadToday(): Promise<TodayData> {
  const student = await studentService.getCurrentStudent()
  const [task, mission, events, signals, insight] = await Promise.all([
    taskService.getCurrentTask(student.id),
    missionService.getCurrentMission(student.id),
    evidenceService.listRecentEvents(student.id, 5),
    growthService.listSignals(student.id),
    growthService.getLatestInsight(student.id),
  ])
  return { student, task, mission, events, signals, insight }
}

export function useTodayData() {
  return useAsyncData(loadToday)
}
