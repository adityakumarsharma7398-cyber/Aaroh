/**
 * AI integration layer (Phase 2 + 3).
 *
 * Member 1 owns this file: it connects mission / hint / reflection generation
 * to the application flow. It does NOT store, score or interpret anything.
 * Events, evidence and signals belong to Member 3's data layer, which plugs in
 * by implementing `AIIntegrationAdapter`. The event shape below is a PROVISIONAL
 * view of what the AI flow emits; Member 3's contract wins if it differs.
 */
import { nextHintLevel, type HintLevel } from "../engines/hint-engine.ts";
import { generateJson } from "./gemini.ts";
import { getMentorResponse } from "./mentor.ts";
import { generateMission } from "./mission.ts";
import { generateReflection } from "./reflection.ts";
import type { Dimension, MentorReference, MentorResponse } from "./schemas.ts";
import type { MissionRequest, MissionResponse } from "./schemas.ts";
import type { ReflectionRequest, ReflectionResponse } from "./reflection.ts";

// ─── Event contract (provisional; Member 3 owns the real one) ────────────────

export type AppEventType =
  | "attempt"
  | "hint_requested"
  | "hint_level_granted"
  | "retry"
  | "reflection"
  | "completed";

export type AppEvent = {
  studentId: string;
  taskId: string;
  type: AppEventType;
  /** AI flow only emits "app". Teacher observations are Member 3's. */
  source: "app";
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string; // ISO timestamp
};

/**
 * What Member 3's data layer must provide. The AI flow only records
 * application events and reads hint history; it never reads or computes
 * evidence or signals.
 */
export interface AIIntegrationAdapter {
  recordEvent(event: AppEvent): Promise<void>;
  /** Hint levels already granted to this student for this task. */
  getGrantedHintLevels(studentId: string, taskId: string): Promise<HintLevel[]>;
}

/** Placeholder until the data layer exists: records nothing, has no history. */
export function createNoopAdapter(): AIIntegrationAdapter {
  return {
    async recordEvent() {},
    async getGrantedHintLevels() {
      return [];
    },
  };
}

/** Event recording is best-effort: a data-layer failure must not break the student's help. */
async function record(
  adapter: AIIntegrationAdapter,
  studentId: string,
  taskId: string,
  type: AppEventType,
  metadata: AppEvent["metadata"] = {},
): Promise<void> {
  try {
    await adapter.recordEvent({
      studentId,
      taskId,
      type,
      source: "app",
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

// ─── Hint (application controls the level) ───────────────────────────────────

export type HintFlowInput = {
  studentId: string;
  taskId: string;
  task: string;
  /** What the student says they tried. Empty if nothing yet. */
  attempt: string;
  dimension?: Dimension;
  mentorReference?: MentorReference;
};

/**
 * hint_requested -> application picks the level -> AI writes that level only
 * -> hint_level_granted. Returns what the student sees.
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
    granted = await adapter.getGrantedHintLevels(studentId, taskId);
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

// ─── Reflection ──────────────────────────────────────────────────────────────

/** Generates a reflection question. Records nothing: no student action has happened yet. */
export function requestReflection(
  req: ReflectionRequest,
  generate: typeof generateJson = generateJson,
): Promise<ReflectionResponse> {
  return generateReflection(req, generate);
}

/** Call when the student actually submits a reflection. Stores only length, not the text. */
export function recordReflectionSubmitted(
  adapter: AIIntegrationAdapter,
  input: {
    studentId: string;
    taskId: string;
    dimension: Dimension;
    response: string;
  },
): Promise<void> {
  return record(adapter, input.studentId, input.taskId, "reflection", {
    dimension: input.dimension,
    responseLength: input.response.trim().length,
  });
}

/** Lets the app record the student actions the AI flow does not see (attempt, retry, completed). */
export function recordStudentAction(
  adapter: AIIntegrationAdapter,
  input: {
    studentId: string;
    taskId: string;
    type: Extract<AppEventType, "attempt" | "retry" | "completed">;
    metadata?: AppEvent["metadata"];
  },
): Promise<void> {
  return record(adapter, input.studentId, input.taskId, input.type, input.metadata);
}
