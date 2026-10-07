import { useAsyncData } from '../../hooks/useAsyncData'
import { taskService } from '../../services/taskService'
import type { Task } from '../../types/domain'

export interface TasksData {
  tasks: Task[]
  /** The task the service recommends focusing on now, if any. */
  currentTaskId?: string
}

async function loadTasks(): Promise<TasksData> {
  const [tasks, current] = await Promise.all([
    taskService.listMyTasks(),
    taskService.getMyCurrentTask(),
  ])
  return { tasks, currentTaskId: current?.id }
}

export function useTasksData() {
  return useAsyncData(loadTasks)
}
