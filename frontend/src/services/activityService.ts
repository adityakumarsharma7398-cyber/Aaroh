// Service boundary (see studentService.ts). Currently backed by the mock backend.
// An activity is the teacher's definition of a piece of academic work; students get their own Task from it.
// Only creation is supported for now. Editing, deleting and assigning will come with the real backend.
import { createActivity } from '../data/mock/mockBackend'
import { copy, db } from '../data/mock/store'
import type { Activity, ActivityInput } from '../types/domain'

export const activityService = {
  async listActivities(): Promise<Activity[]> {
    return copy(db.activities)
  },

  async createActivity(input: ActivityInput): Promise<Activity> {
    return createActivity(input)
  },
}
