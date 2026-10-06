import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/client";
import { events } from "../db/schema";
import {
  EVENT_TYPES,
  EVENT_SOURCES,
  type ObservableEvent,
  type RecordEventInput,
} from "@education-growth/shared";

/**
 * Lightweight runtime validation to ensure invalid events cannot silently
 * enter the database through typed or untyped application code.
 */
function validateEventInput(input: RecordEventInput): void {
  if (!input) {
    throw new Error("Event input is required");
  }
  if (!input.studentId || typeof input.studentId !== "string" || input.studentId.trim().length === 0) {
    throw new Error("Invalid studentId: studentId is required and must be a non-empty string");
  }
  if (
    input.taskId !== undefined &&
    input.taskId !== null &&
    (typeof input.taskId !== "string" || input.taskId.trim().length === 0)
  ) {
    throw new Error("Invalid taskId: taskId must be a non-empty string or null/undefined");
  }
  if (!input.type || !EVENT_TYPES.includes(input.type)) {
    throw new Error(
      `Invalid event type '${String(input.type)}'. Allowed types: ${EVENT_TYPES.join(", ")}`
    );
  }
  if (!input.source || !EVENT_SOURCES.includes(input.source)) {
    throw new Error(
      `Invalid event source '${String(input.source)}'. Allowed sources: ${EVENT_SOURCES.join(", ")}`
    );
  }
  if (
    input.metadata !== undefined &&
    (typeof input.metadata !== "object" || input.metadata === null || Array.isArray(input.metadata))
  ) {
    throw new Error("Invalid metadata: metadata must be a plain object");
  }
}

/**
 * Records an observable student action into the database.
 * 
 * - Generates unique ID and ISO timestamp if not provided
 * - Validates schema constraints and controlled vocabulary
 * - Inserts into SQLite using Drizzle
 * - Returns the created event
 */
export async function recordEvent(input: RecordEventInput): Promise<ObservableEvent> {
  validateEventInput(input);

  const eventRecord: ObservableEvent = {
    id: randomUUID(),
    studentId: input.studentId.trim(),
    taskId: input.taskId ? input.taskId.trim() : null,
    type: input.type,
    source: input.source,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  await db.insert(events).values(eventRecord);

  return eventRecord;
}

/**
 * Retrieves all events recorded for a specific student in chronological order.
 */
export async function getStudentEvents(studentId: string): Promise<ObservableEvent[]> {
  if (!studentId || typeof studentId !== "string") {
    throw new Error("Invalid studentId: studentId must be a non-empty string");
  }

  const results = await db
    .select()
    .from(events)
    .where(eq(events.studentId, studentId.trim()))
    .orderBy(asc(events.createdAt), asc(events.id));

  return results as ObservableEvent[];
}

/**
 * Retrieves all events recorded for a specific task in chronological order.
 */
export async function getTaskEvents(taskId: string): Promise<ObservableEvent[]> {
  if (!taskId || typeof taskId !== "string") {
    throw new Error("Invalid taskId: taskId must be a non-empty string");
  }

  const results = await db
    .select()
    .from(events)
    .where(eq(events.taskId, taskId.trim()))
    .orderBy(asc(events.createdAt), asc(events.id));

  return results as ObservableEvent[];
}

/**
 * Retrieves events for a specific student on a specific task in chronological order.
 */
export async function getStudentTaskEvents(
  studentId: string,
  taskId: string
): Promise<ObservableEvent[]> {
  if (!studentId || typeof studentId !== "string") {
    throw new Error("Invalid studentId: studentId must be a non-empty string");
  }
  if (!taskId || typeof taskId !== "string") {
    throw new Error("Invalid taskId: taskId must be a non-empty string");
  }

  const results = await db
    .select()
    .from(events)
    .where(and(eq(events.studentId, studentId.trim()), eq(events.taskId, taskId.trim())))
    .orderBy(asc(events.createdAt), asc(events.id));

  return results as ObservableEvent[];
}
