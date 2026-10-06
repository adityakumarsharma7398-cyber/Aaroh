import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";
import { recordEvent, getStudentEvents } from "../events/logger";
import { generateEvidence, persistEvidence } from "../engine/evidence";
import { ApiError } from "../middleware/error";
import type { EventType } from "@education-growth/shared";

export type HintLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ResponseMode =
  | "independent_thinking_pushback"
  | "reflective_prompt"
  | "conceptual_hint"
  | "structured_guidance"
  | "worked_example"
  | "direct_solution";

export interface MentorHint {
  id: string;
  taskId: string;
  level: HintLevel;
  content: string;
  responseMode: ResponseMode;
  grantedAt: string;
}

export interface MentorSession {
  taskId: string;
  currentLevel: HintLevel;
  hints: MentorHint[];
}

/**
 * Member 1 AI Integration Adapter Interface.
 * Implements the contract required by Member 1's AI engine (lib/ai/integration.ts).
 */
export interface AIIntegrationAdapter {
  recordEvent(event: {
    studentId: string;
    taskId: string;
    type: string;
    source: "app";
    metadata: Record<string, unknown>;
    createdAt: string;
  }): Promise<void>;
  getGrantedHintLevels(studentId: string, taskId: string): Promise<HintLevel[]>;
}

export const aiIntegrationAdapter: AIIntegrationAdapter = {
  async recordEvent(event) {
    await recordEvent({
      studentId: event.studentId,
      taskId: event.taskId,
      type: event.type as EventType,
      source: "app",
      metadata: event.metadata,
      createdAt: event.createdAt,
    });
  },
  async getGrantedHintLevels(studentId: string, taskId: string): Promise<HintLevel[]> {
    const studentEvents = await getStudentEvents(studentId);
    const grantedEvents = studentEvents.filter(
      (e) => e.taskId === taskId && e.type === "hint_level_granted"
    );
    return grantedEvents
      .map((e) => (typeof e.metadata.level === "number" ? (e.metadata.level as HintLevel) : null))
      .filter((l): l is HintLevel => l !== null);
  },
};

/** Pre-authored task-specific guidance for seeded academic tasks */
const TASK_SPECIFIC_HINTS: Record<string, Record<HintLevel, { content: string; mode: ResponseMode }>> = {
  "task-math-101": {
    0: {
      content: "Before I give you a hint, tell me exactly where you are stuck and what you have tried.",
      mode: "independent_thinking_pushback",
    },
    1: {
      content: "What is your main goal when isolating the variable in a linear equation? Which terms can you combine first?",
      mode: "reflective_prompt",
    },
    2: {
      content: "Recall the balance principle: whatever operation you apply to one side of the equation, apply identically to the other.",
      mode: "conceptual_hint",
    },
    3: {
      content: "Follow these steps:\n1. Move all constant terms to the right-hand side using inverse addition/subtraction.\n2. Combine like variable terms on the left.\n3. Divide both sides by the coefficient of x.",
      mode: "structured_guidance",
    },
    4: {
      content: "Example: For 3x + 7 = 22:\nSubtract 7 from both sides: 3x = 15.\nDivide both sides by 3: x = 5.\nNow apply the exact same steps to your problem.",
      mode: "worked_example",
    },
    5: {
      content: "Full worked solution: Combine like terms, subtract the constant, and isolate the variable to obtain the exact root.",
      mode: "direct_solution",
    },
  },
  "task-math-102": {
    0: {
      content: "Before I give you a hint, tell me exactly where you are stuck and what you have tried.",
      mode: "independent_thinking_pushback",
    },
    1: {
      content: "Would substitution or elimination be faster given the coefficients in this system? Why?",
      mode: "reflective_prompt",
    },
    2: {
      content: "Elimination works best when matching coefficients have opposite signs. Multiplying one equation by a constant can create this match.",
      mode: "conceptual_hint",
    },
    3: {
      content: "Steps:\n1. Align both equations in standard form (Ax + By = C).\n2. Multiply one equation so one variable cancels when adding.\n3. Solve for the remaining variable.\n4. Substitute back to find the second variable.",
      mode: "structured_guidance",
    },
    4: {
      content: "Example: System 2x + y = 7 and x - y = 2.\nAdding equations eliminates y: 3x = 9, so x = 3.\nSubstitute x=3 into second equation: 3 - y = 2 => y = 1. Solution: (3, 1).",
      mode: "worked_example",
    },
    5: {
      content: "Direct solution: Eliminate the variable with opposite coefficients, solve for x, and back-substitute to find y.",
      mode: "direct_solution",
    },
  },
};

/** Contextual fallback hint generator when specific text is not pre-authored */
function generateContextualHint(
  title: string,
  subject: string,
  level: HintLevel
): { content: string; mode: ResponseMode } {
  switch (level) {
    case 0:
      return {
        content: "Before I give you a hint, tell me exactly where you are stuck and what you have tried.",
        mode: "independent_thinking_pushback",
      };
    case 1:
      return {
        content: `Reflect on the core objective of '${title}'. What would an initial step look like in ${subject}?`,
        mode: "reflective_prompt",
      };
    case 2:
      return {
        content: `Identify the underlying concept in ${subject} that governs '${title}'. How can that rule simplify the problem?`,
        mode: "conceptual_hint",
      };
    case 3:
      return {
        content: `Structured steps:\n1. Break the task into two sub-problems.\n2. Work through the first part systematically.\n3. Verify your intermediate result before proceeding.`,
        mode: "structured_guidance",
      };
    case 4:
      return {
        content: `Worked parallel example: Consider an analogous problem with smaller numbers. Solve that step-by-step, then apply the same strategy to '${title}'.`,
        mode: "worked_example",
      };
    case 5:
      return {
        content: `Direct solution strategy: Analyze each component of the prompt and synthesize your final solution using standard ${subject} principles.`,
        mode: "direct_solution",
      };
  }
}

export class HintService {
  /**
   * Retrieves the current mentor session and hint progression for a task.
   */
  async getMentorSession(studentId: string, taskId: string): Promise<MentorSession> {
    const studentEvents = await getStudentEvents(studentId);
    const hintEvents = studentEvents.filter(
      (e) => e.taskId === taskId && e.type === "hint_level_granted"
    );

    const hints: MentorHint[] = hintEvents.map((ev) => {
      const level = (Number(ev.metadata.level) || 0) as HintLevel;
      return {
        id: ev.id,
        taskId,
        level,
        content: String(ev.metadata.content || ""),
        responseMode: (ev.metadata.responseMode as ResponseMode) || "conceptual_hint",
        grantedAt: ev.createdAt,
      };
    });

    const currentLevel = hints.reduce<HintLevel>(
      (max, h) => (h.level > max ? h.level : max),
      0
    );

    return {
      taskId,
      currentLevel,
      hints,
    };
  }

  /**
   * Authoritatively grants the next hint level.
   * 
   * Strict Rules:
   * 1. The client must NOT specify a hint level ('level', 'hintLevel', or 'requestedLevel').
   * 2. The server calculates the level from historical hint events.
   * 3. Level 0 is returned if no prior hints exist and student has not attempted/described the problem.
   * 4. Guidance advances exactly one level at a time, capped at 5.
   * 5. Emits 'hint_requested' and 'hint_level_granted' events.
   * 6. Triggers deterministic evidence generation.
   */
  async requestMentorHint(
    studentId: string,
    taskId: string,
    attemptDescription?: string,
    clientForbiddenKeys?: unknown
  ): Promise<MentorHint> {
    // Authoritative check: reject client-supplied level parameters
    if (clientForbiddenKeys !== undefined && clientForbiddenKeys !== null) {
      throw new ApiError(
        400,
        "UNAUTHORIZED_HINT_LEVEL",
        "Hint level is server-controlled. Clients must not supply 'level', 'hintLevel', or 'requestedLevel'."
      );
    }

    const matchedTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (matchedTask.length === 0) {
      throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' not found.`);
    }
    const task = matchedTask[0];

    // Log the request event
    await recordEvent({
      studentId,
      taskId,
      type: "hint_requested",
      source: "student",
      metadata: {
        hasAttemptDescription: Boolean(attemptDescription && attemptDescription.trim().length > 0),
      },
    });

    // Calculate granted levels from database history
    const studentEvents = await getStudentEvents(studentId);
    const grantedEvents = studentEvents.filter(
      (e) => e.taskId === taskId && e.type === "hint_level_granted"
    );
    const grantedLevels = grantedEvents
      .map((e) => (typeof e.metadata.level === "number" ? (e.metadata.level as HintLevel) : null))
      .filter((l): l is HintLevel => l !== null);

    let nextLevel: HintLevel = 0;
    const hasAttemptText = Boolean(attemptDescription && attemptDescription.trim().length > 0);
    const hasPriorAttempts = studentEvents.some(
      (e) => e.taskId === taskId && (e.type === "attempt" || e.type === "retry")
    );

    if (grantedLevels.length === 0) {
      // If student has described attempt or has previously logged an attempt, grant Level 1.
      // Otherwise push back with Level 0.
      nextLevel = hasAttemptText || hasPriorAttempts ? 1 : 0;
    } else {
      const highest = Math.max(...grantedLevels);
      nextLevel = Math.min(5, highest + 1) as HintLevel;
    }

    // Determine hint content
    const taskHints = TASK_SPECIFIC_HINTS[taskId];
    const { content, mode } = taskHints && taskHints[nextLevel]
      ? taskHints[nextLevel]
      : generateContextualHint(task.title, task.subject, nextLevel);

    // Record authoritative hint_level_granted event
    const grantedEvent = await recordEvent({
      studentId,
      taskId,
      type: "hint_level_granted",
      source: "app",
      metadata: {
        level: nextLevel,
        content,
        responseMode: mode,
      },
    });

    // Run deterministic evidence pipeline
    const updatedEvents = await getStudentEvents(studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      id: grantedEvent.id,
      taskId,
      level: nextLevel,
      content,
      responseMode: mode,
      grantedAt: grantedEvent.createdAt,
    };
  }
}

export const hintService = new HintService();
