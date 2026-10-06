/**
 * AI <-> backend integration layer (Member 1).
 *
 * Connects mission / hint / reflection generation to the backend WITHOUT
 * storing, scoring or interpreting anything. Events, evidence and signals are
 * owned by Member 3's backend (server/, shared/): the adapter below maps 1:1
 * onto functions that already exist there. Event types and shapes come from
 * shared/ (type-only imports, no duplication).
 *
 * Identity: `studentId` must come from the backend's authenticated session,
 * never from a request body. Hint levels are chosen here from the stored
 * hint history, never from the client.
 */
import type {
  AcademicTask,
  DevelopmentDimension,
  EventType,
  Mission as BackendMission,
  ObservableEvent,
  RecordEventInput,
} from "../../../shared/src/index.ts";
import { isHintLevel, nextHintLevel, type HintLevel } from "../engines/hint-engine.ts";
import { generateJson } from "./gemini.ts";
import { getMentorResponse } from "./mentor.ts";
import { generateMission } from "./mission.ts";
import { generateReflection } from "./reflection.ts";
import type {
  Mission,
  MissionRequest,
  MissionResponse,
  MentorReference,
  MentorResponse,
} from "./schemas.ts";
import type { ReflectionRequest, ReflectionResponse } from "./reflection.ts";

// ─── Events (canonical definitions live in shared/) ──────────────────────────

/** The subset of backend event types the AI flow emits. */
export type AIEventType = Extract<
  EventType,
  "attempt" | "hint_requested" | "hint_level_granted" | "retry" | "reflection" | "completed"
>;

/** What the AI flow sends to the backend: shared/ RecordEventInput with createdAt always set. */
export type AppEvent = RecordEventInput & { createdAt: string };

/**
 * Source convention used by the backend seed data: things the student does
 * are "student", things the application decides or records are "app".
 */
const SOURCE_BY_TYPE: Record<AIEventType, "app" | "student"> = {
  attempt: "app",
  hint_requested: "student",
  hint_level_granted: "app",
  retry: "app",
  reflection: "student",
  completed: "app",
};

/**
 * What the backend must provide. Maps onto existing server/src/events/logger.ts:
 *   recordEvent          -> recordEvent(input)
 *   getStudentTaskEvents -> getStudentTaskEvents(studentId, taskId)
 * `getTask` does NOT exist yet (Member 3 requirement): it must read the tasks table.
 * The AI flow never reads or computes evidence or signals.
 */
export interface AIIntegrationAdapter {
  recordEvent(input: RecordEventInput): Promise<unknown>;
  getStudentTaskEvents(
    studentId: string,
    taskId: string,
  ): Promise<Pick<ObservableEvent, "type" | "metadata">[]>;
  getTask(
    taskId: string,
  ): Promise<Pick<AcademicTask, "id" | "title" | "subject" | "description"> | null>;
}

/** Placeholder: records nothing, has no history and no tasks. */
export function createNoopAdapter(): AIIntegrationAdapter {
  return {
    async recordEvent() {},
    async getStudentTaskEvents() {
      return [];
    },
    async getTask() {
      return null;
    },
  };
}

/** Levels already granted, read from the backend's own hint_level_granted events. */
export function grantedLevelsFromEvents(
  events: Pick<ObservableEvent, "type" | "metadata">[],
): HintLevel[] {
  return events
    .filter((e) => e.type === "hint_level_granted")
    .map((e) => e.metadata?.level)
    .filter(isHintLevel);
}

/** Event recording is best-effort: a backend failure must not break the student's help. */
async function record(
  adapter: AIIntegrationAdapter,
  studentId: string,
  taskId: string,
  type: AIEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await adapter.recordEvent({
      studentId,
      taskId,
      type,
      source: SOURCE_BY_TYPE[type],
      metadata,
      createdAt: new Date().toISOString(),
    });
  } catch {
    console.error(`[integration] failed to record ${type} event`);
  }
}

// ─── Mission ─────────────────────────────────────────────────────────────────

export function requestMission(
  req: MissionRequest,
  generate: typeof generateJson = generateJson,
): Promise<MissionResponse> {
  return generateMission(req, generate);
}

/**
 * Maps an AI mission onto the backend's Mission row (without id, status,
 * createdAt, which the backend assigns). Lossy: the backend Mission has one
 * `instruction` string, so title, challenge, focus, steps and the reflection
 * question are flattened into it. Persistence is the backend's job.
 */
export function toBackendMissionDraft(
  mission: Mission,
  ctx: { taskId: string; studentId: string; dimension: DevelopmentDimension },
): Omit<BackendMission, "id" | "status" | "createdAt"> {
  const steps = mission.instructions.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const instruction = [
    `${mission.title}: ${mission.challenge}`,
    `Focus: ${mission.focus}`,
    steps,
    mission.reflection ? `Reflect: ${mission.reflection}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    taskId: ctx.taskId,
    studentId: ctx.studentId,
    instruction,
    dimensions: [ctx.dimension],
  };
}

// ─── Hint (the application controls the level) ───────────────────────────────

export type HintFlowInput = {
  studentId: string;
  taskId: string;
  task: string;
  /** What the student says they tried. Empty if nothing yet. */
  attempt: string;
  dimension?: DevelopmentDimension;
  mentorReference?: MentorReference;
};

/**
 * hint_requested -> level chosen from the backend's hint history -> AI writes
 * that level only -> hint_level_granted (metadata.level, the field the
 * backend evidence rules read).
 */
export async function requestHint(
  adapter: AIIntegrationAdapter,
  input: HintFlowInput,
  generate: typeof generateJson = generateJson,
): Promise<MentorResponse> {
  const { studentId, taskId } = input;
  await record(adapter, studentId, taskId, "hint_requested");

  let granted: HintLevel[] = [];
  try {
    granted = grantedLevelsFromEvents(
      await adapter.getStudentTaskEvents(studentId, taskId),
    );
  } catch {
    console.error("[integration] failed to read hint history");
  }

  const level = nextHintLevel(granted, input.attempt.trim().length > 0);
  const response = await getMentorResponse(
    {
      task: input.task,
      attempt: input.attempt,
      hintLevel: level,
      dimension: input.dimension,
      mentorReference: input.mentorReference,
    },
    generate,
  );

  await record(adapter, studentId, taskId, "hint_level_granted", {
    level, // application-selected, not from the AI
    source: response.source,
  });
  return response;
}

/**
 * Trusted client-facing path: the client sends only a taskId (see
 * clientHintRequestSchema). The task text comes from the backend, the identity
 * from the session, and the level from stored history.
 */
export async function requestHintForTask(
  adapter: AIIntegrationAdapter,
  input: Omit<HintFlowInput, "task">,
  generate: typeof generateJson = generateJson,
): Promise<{ ok: true; data: MentorResponse } | { ok: false; error: "task_not_found" }> {
  const task = await adapter.getTask(input.taskId);
  if (!task) return { ok: false, error: "task_not_found" };
  const text = `${task.title} (${task.subject}): ${task.description}`.slice(0, 4000);
  return { ok: true, data: await requestHint(adapter, { ...input, task: text }, generate) };
}

// ─── Reflection ──────────────────────────────────────────────────────────────

/** Generates a reflection question. Records nothing: no student action has happened yet. */
export function requestReflection(
  req: ReflectionRequest,
  generate: typeof generateJson = generateJson,
): Promise<ReflectionResponse> {
  return generateReflection(req, generate);
}

/**
 * Call when the student actually submits a reflection. The text is user data
 * and goes to the backend as `metadata.note` (the backend's own convention).
 * It is never interpreted by AI; the backend rules decide what it counts for.
 */
export function recordReflectionSubmitted(
  adapter: AIIntegrationAdapter,
  input: {
    studentId: string;
    taskId: string;
    dimension: DevelopmentDimension;
    response: string;
  },
): Promise<void> {
  const note = input.response.trim().slice(0, 2000);
  return record(adapter, input.studentId, input.taskId, "reflection", {
    dimension: input.dimension,
    note,
    responseLength: note.length,
  });
}

/** Lets the app record student actions the AI flow does not see (attempt, retry, completed). */
export function recordStudentAction(
  adapter: AIIntegrationAdapter,
  input: {
    studentId: string;
    taskId: string;
    type: Extract<AIEventType, "attempt" | "retry" | "completed">;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  return record(adapter, input.studentId, input.taskId, input.type, input.metadata);
}
