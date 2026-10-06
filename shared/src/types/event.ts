export const EVENT_TYPES = [
  "attempt",
  "hint_requested",
  "hint_level_granted",
  "retry",
  "feedback_applied",
  "completed",
  "reflection",
  "teacher_observation",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_SOURCES = ["app", "teacher", "student"] as const;

export type EventSource = (typeof EVENT_SOURCES)[number];

export interface ObservableEvent {
  id: string;
  studentId: string;
  taskId?: string | null;
  type: EventType;
  source: EventSource;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecordEventInput {
  studentId: string;
  taskId?: string | null;
  type: EventType;
  source: EventSource;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}
