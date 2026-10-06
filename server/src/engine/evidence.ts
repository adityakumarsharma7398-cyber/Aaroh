import { createHash } from "node:crypto";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/client";
import { evidence } from "../db/schema";
import type {
  ObservableEvent,
  EvidenceRecord,
  DevelopmentDimension,
  EvidenceStrength,
} from "@education-growth/shared";

/**
 * Creates a deterministic, collision-resistant evidence ID based on rule, student,
 * and the exact set of supporting event IDs.
 * Guarantees that the exact same input events always generate the exact same evidence ID.
 */
export function generateDeterministicEvidenceId(
  ruleId: string,
  studentId: string,
  supportingEventIds: string[]
): string {
  const sortedIds = [...supportingEventIds].sort().join(",");
  const hash = createHash("sha256")
    .update(`${ruleId}:${studentId}:${sortedIds}`)
    .digest("hex")
    .slice(0, 16);
  return `ev-${ruleId.toLowerCase()}-${hash}`;
}

/**
 * Derives a deterministic timestamp for evidence based on the latest supporting event.
 */
function getDeterministicTimestamp(events: ObservableEvent[], supportingIds: string[]): string {
  const matching = events.filter((e) => supportingIds.includes(e.id));
  if (matching.length === 0) {
    return new Date().toISOString();
  }
  const timestamps = matching.map((e) => new Date(e.createdAt).getTime());
  const maxTimestamp = Math.max(...timestamps);
  return new Date(maxTimestamp).toISOString();
}

/**
 * RULE 1 — SELF RELIANCE (SR-01)
 * Detects decreasing reliance on hints across comparable completed tasks.
 * 
 * Condition:
 * At least 3 completed tasks with hint data showing a downward progression in maximum hint level.
 * Single task or insufficient progression will NOT claim development.
 */
export function evaluateSelfReliance(events: ObservableEvent[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const eventsByStudent = groupBy(events, (e) => e.studentId);

  for (const [studentId, studentEvents] of Object.entries(eventsByStudent)) {
    // Group events by taskId
    const taskEventsMap = groupBy(
      studentEvents.filter((e) => e.taskId !== null && e.taskId !== undefined),
      (e) => e.taskId as string
    );

    interface TaskSummary {
      taskId: string;
      completedAt: number;
      maxHintLevel: number;
      completionEventId: string;
      hintEventIds: string[];
    }

    const completedTasksWithHints: TaskSummary[] = [];

    for (const [taskId, tEvents] of Object.entries(taskEventsMap)) {
      // Find completion event
      const completionEvent = tEvents.find(
        (e) => e.type === "completed" && e.metadata.success !== false
      );
      if (!completionEvent) continue;

      // Find hint_level_granted events
      const hintEvents = tEvents.filter((e) => e.type === "hint_level_granted");
      if (hintEvents.length === 0) continue;

      const levels = hintEvents
        .map((e) => (typeof e.metadata.level === "number" ? e.metadata.level : null))
        .filter((l): l is number => l !== null);

      if (levels.length === 0) continue;

      const maxLevel = Math.max(...levels);
      completedTasksWithHints.push({
        taskId,
        completedAt: new Date(completionEvent.createdAt).getTime(),
        maxHintLevel: maxLevel,
        completionEventId: completionEvent.id,
        hintEventIds: hintEvents.map((e) => e.id),
      });
    }

    // Sort completed tasks chronologically by completion time
    completedTasksWithHints.sort((a, b) => a.completedAt - b.completedAt);

    // Rule requirement: at least 3 comparable tasks
    if (completedTasksWithHints.length < 3) {
      // Insufficient sample size; do NOT claim development
      continue;
    }

    // Check for clear downward trend: start level > end level, monotonic non-increasing
    const startLevel = completedTasksWithHints[0].maxHintLevel;
    const endLevel = completedTasksWithHints[completedTasksWithHints.length - 1].maxHintLevel;

    let isDecreasing = startLevel > endLevel;
    for (let i = 1; i < completedTasksWithHints.length; i++) {
      if (completedTasksWithHints[i].maxHintLevel > completedTasksWithHints[i - 1].maxHintLevel) {
        isDecreasing = false;
        break;
      }
    }

    if (isDecreasing) {
      const taskCount = completedTasksWithHints.length;
      const supportingEventIds = completedTasksWithHints.flatMap((t) => [
        t.completionEventId,
        ...t.hintEventIds,
      ]);

      const id = generateDeterministicEvidenceId("SR-01", studentId, supportingEventIds);
      const createdAt = getDeterministicTimestamp(studentEvents, supportingEventIds);

      records.push({
        id,
        studentId,
        taskId: null, // Cross-task pattern
        dimension: "self_reliance",
        ruleId: "SR-01",
        summary: `Across ${taskCount} comparable tasks, the highest hint level decreased from ${startLevel} to ${endLevel} while the tasks were completed.`,
        supportingEventIds,
        strength: "strengthening",
        createdAt,
      });
    }
  }

  return records;
}

/**
 * RULE 2 — PERSEVERANCE (PE-01)
 * Detects observable persistence:
 * failed attempt -> retry -> eventual completion
 */
export function evaluatePerseverance(events: ObservableEvent[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const eventsByStudent = groupBy(events, (e) => e.studentId);

  for (const [studentId, studentEvents] of Object.entries(eventsByStudent)) {
    const taskEventsMap = groupBy(
      studentEvents.filter((e) => e.taskId !== null && e.taskId !== undefined),
      (e) => e.taskId as string
    );

    let perseveredTaskCount = 0;
    const taskEvidences: Array<{ taskId: string; supportingIds: string[] }> = [];

    for (const [taskId, tEvents] of Object.entries(taskEventsMap)) {
      // Sort task events chronologically
      const sorted = [...tEvents].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Search for: attempt(failed) -> retry -> completed(success)
      let failedAttempt: ObservableEvent | null = null;
      let retryEvent: ObservableEvent | null = null;
      let completedEvent: ObservableEvent | null = null;

      for (const ev of sorted) {
        if (
          !failedAttempt &&
          ev.type === "attempt" &&
          (ev.metadata.result === "failed" || ev.metadata.success === false)
        ) {
          failedAttempt = ev;
        } else if (failedAttempt && !retryEvent && ev.type === "retry") {
          retryEvent = ev;
        } else if (
          failedAttempt &&
          retryEvent &&
          !completedEvent &&
          ev.type === "completed" &&
          ev.metadata.success !== false
        ) {
          completedEvent = ev;
          break;
        }
      }

      if (failedAttempt && retryEvent && completedEvent) {
        perseveredTaskCount++;
        taskEvidences.push({
          taskId,
          supportingIds: [failedAttempt.id, retryEvent.id, completedEvent.id],
        });
      }
    }

    // Determine strength based on frequency across tasks
    const strength: EvidenceStrength = perseveredTaskCount >= 2 ? "strengthening" : "developing";

    for (const item of taskEvidences) {
      const id = generateDeterministicEvidenceId("PE-01", studentId, item.supportingIds);
      const createdAt = getDeterministicTimestamp(studentEvents, item.supportingIds);

      records.push({
        id,
        studentId,
        taskId: item.taskId,
        dimension: "perseverance",
        ruleId: "PE-01",
        summary: "The student retried after an unsuccessful attempt and subsequently completed the task.",
        supportingEventIds: item.supportingIds,
        strength,
        createdAt,
      });
    }
  }

  return records;
}

/**
 * RULE 3 — PROBLEM SOLVING (PS-01)
 * Detects iterative problem solving:
 * attempt -> feedback_applied -> retry -> completed
 */
export function evaluateProblemSolving(events: ObservableEvent[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const eventsByStudent = groupBy(events, (e) => e.studentId);

  for (const [studentId, studentEvents] of Object.entries(eventsByStudent)) {
    const taskEventsMap = groupBy(
      studentEvents.filter((e) => e.taskId !== null && e.taskId !== undefined),
      (e) => e.taskId as string
    );

    for (const [taskId, tEvents] of Object.entries(taskEventsMap)) {
      const sorted = [...tEvents].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      let initialAttempt: ObservableEvent | null = null;
      let feedbackApplied: ObservableEvent | null = null;
      let retryEvent: ObservableEvent | null = null;
      let completedEvent: ObservableEvent | null = null;

      for (const ev of sorted) {
        if (!initialAttempt && ev.type === "attempt") {
          initialAttempt = ev;
        } else if (initialAttempt && !feedbackApplied && ev.type === "feedback_applied") {
          feedbackApplied = ev;
        } else if (initialAttempt && feedbackApplied && !retryEvent && ev.type === "retry") {
          retryEvent = ev;
        } else if (
          initialAttempt &&
          feedbackApplied &&
          retryEvent &&
          !completedEvent &&
          ev.type === "completed" &&
          ev.metadata.success !== false
        ) {
          completedEvent = ev;
          break;
        }
      }

      if (initialAttempt && feedbackApplied && retryEvent && completedEvent) {
        const supportingEventIds = [
          initialAttempt.id,
          feedbackApplied.id,
          retryEvent.id,
          completedEvent.id,
        ];
        const id = generateDeterministicEvidenceId("PS-01", studentId, supportingEventIds);
        const createdAt = getDeterministicTimestamp(studentEvents, supportingEventIds);

        records.push({
          id,
          studentId,
          taskId,
          dimension: "problem_solving",
          ruleId: "PS-01",
          summary: "After feedback was applied, the student retried and subsequently completed the task.",
          supportingEventIds,
          strength: "developing",
          createdAt,
        });
      }
    }
  }

  return records;
}

/**
 * RULE 4 — INITIATIVE (IN-01)
 * Conservative. Only generates evidence from explicit observable events
 * such as a teacher observation indicating optional extension completion.
 */
export function evaluateInitiative(events: ObservableEvent[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];

  for (const ev of events) {
    if (ev.type === "teacher_observation") {
      const category = ev.metadata.category;
      if (category === "optional_extension_completed" || category === "optional_extension") {
        const supportingEventIds = [ev.id];
        const id = generateDeterministicEvidenceId("IN-01", ev.studentId, supportingEventIds);
        const summary =
          typeof ev.metadata.note === "string" && ev.metadata.note.trim().length > 0
            ? `Teacher-observed: ${ev.metadata.note.trim()}`
            : "Teacher-observed: student completed an optional extension beyond the required task.";

        records.push({
          id,
          studentId: ev.studentId,
          taskId: ev.taskId ?? null,
          dimension: "initiative",
          ruleId: "IN-01",
          summary,
          supportingEventIds,
          strength: "developing",
          createdAt: ev.createdAt,
        });
      }
    }
  }

  return records;
}

/**
 * RULE 5 — SUSTAINED ENGAGEMENT (SE-01)
 * Highly conservative. Never claims concentration or internal attention.
 * Only generates evidence on observable multi-action sessions or explicit teacher observations.
 */
export function evaluateSustainedEngagement(events: ObservableEvent[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const eventsByStudent = groupBy(events, (e) => e.studentId);

  for (const [studentId, studentEvents] of Object.entries(eventsByStudent)) {
    // 1. Check explicit teacher observation
    for (const ev of studentEvents) {
      if (
        ev.type === "teacher_observation" &&
        ev.metadata.category === "sustained_engagement"
      ) {
        const supportingEventIds = [ev.id];
        const id = generateDeterministicEvidenceId("SE-01", studentId, supportingEventIds);
        records.push({
          id,
          studentId,
          taskId: ev.taskId ?? null,
          dimension: "sustained_engagement",
          ruleId: "SE-01",
          summary: "Observed sustained engagement during the task.",
          supportingEventIds,
          strength: "developing",
          createdAt: ev.createdAt,
        });
      }
    }

    // 2. Check observable task engagement patterns (>= 4 active events with attempts and reflections)
    const taskEventsMap = groupBy(
      studentEvents.filter((e) => e.taskId !== null && e.taskId !== undefined),
      (e) => e.taskId as string
    );

    for (const [taskId, tEvents] of Object.entries(taskEventsMap)) {
      const activeEvents = tEvents.filter((e) =>
        ["attempt", "retry", "reflection", "feedback_applied"].includes(e.type)
      );

      const hasMultipleAttempts = activeEvents.filter((e) => e.type === "attempt" || e.type === "retry").length >= 2;
      const hasReflectionOrFeedback = activeEvents.some((e) => e.type === "reflection" || e.type === "feedback_applied");

      if (activeEvents.length >= 4 && hasMultipleAttempts && hasReflectionOrFeedback) {
        const supportingEventIds = activeEvents.map((e) => e.id);
        const id = generateDeterministicEvidenceId("SE-01", studentId, supportingEventIds);
        const createdAt = getDeterministicTimestamp(studentEvents, supportingEventIds);

        records.push({
          id,
          studentId,
          taskId,
          dimension: "sustained_engagement",
          ruleId: "SE-01",
          summary: "Observed sustained engagement during the task across multiple iterative actions and reflections.",
          supportingEventIds,
          strength: "developing",
          createdAt,
        });
      }
    }
  }

  return records;
}

/**
 * Pure, deterministic engine entry point:
 * Takes an array of observable events and evaluates all deterministic evidence rules.
 */
export function generateEvidence(events: ObservableEvent[]): EvidenceRecord[] {
  if (!events || events.length === 0) {
    return [];
  }

  const allRecords: EvidenceRecord[] = [
    ...evaluateSelfReliance(events),
    ...evaluatePerseverance(events),
    ...evaluateProblemSolving(events),
    ...evaluateInitiative(events),
    ...evaluateSustainedEngagement(events),
  ];

  // Return deterministically sorted by createdAt and id
  return allRecords.sort((a, b) => {
    const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Optional persistence helper: Saves generated evidence records into SQLite
 * with idempotency (ignores records that already exist).
 */
export async function persistEvidence(records: EvidenceRecord[]): Promise<EvidenceRecord[]> {
  if (!records || records.length === 0) {
    return [];
  }

  for (const record of records) {
    await db
      .insert(evidence)
      .values({
        id: record.id,
        studentId: record.studentId,
        taskId: record.taskId ?? null,
        dimension: record.dimension,
        ruleId: record.ruleId,
        summary: record.summary,
        supportingEventIds: record.supportingEventIds,
        strength: record.strength,
        createdAt: record.createdAt,
      })
      .onConflictDoNothing();
  }

  return records;
}

/**
 * Retrieves persisted evidence records for a student ordered chronologically.
 */
export async function getStudentEvidence(studentId: string): Promise<EvidenceRecord[]> {
  if (!studentId || typeof studentId !== "string") {
    throw new Error("Invalid studentId: studentId must be a non-empty string");
  }

  const results = await db
    .select()
    .from(evidence)
    .where(eq(evidence.studentId, studentId.trim()))
    .orderBy(asc(evidence.createdAt), asc(evidence.id));

  return results as EvidenceRecord[];
}

/**
 * Utility: groups array items by string key
 */
function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}
