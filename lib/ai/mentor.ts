import { LEVEL_0_PROMPT, type HintLevel } from "../engines/hint-engine.ts";
import { GeminiError, generateJson } from "./gemini.ts";
import { getFallbackResponse } from "./fallbacks.ts";
import { buildUserPrompt, SYSTEM_INSTRUCTION } from "./prompts.ts";
import {
  geminiOutputSchemas,
  mentorResponseSchema,
  type GeminiLevel,
  type MentorRequest,
  type MentorResponse,
} from "./schemas.ts";

/**
 * Validates Gemini's raw JSON against the schema for the application-selected
 * level and composes the student-facing text. Throws if invalid.
 * Only fields allowed at that level can survive parsing.
 */
export function composeResponse(
  level: GeminiLevel,
  raw: string,
): string {
  const json: unknown = JSON.parse(raw);
  switch (level) {
    case 1: {
      const o = geminiOutputSchemas[1].parse(json);
      return o.questions.join("\n");
    }
    case 2: {
      const o = geminiOutputSchemas[2].parse(json);
      return `${o.concept}: ${o.direction}`;
    }
    case 3: {
      const o = geminiOutputSchemas[3].parse(json);
      return o.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
    case 4: {
      const o = geminiOutputSchemas[4].parse(json);
      return `Example (a different problem, not your task):\n${o.exampleProblem}\n\n${o.exampleSolution}\n\nApplying it to your task: ${o.howToApply}`;
    }
    case 5: {
      const o = geminiOutputSchemas[5].parse(json);
      return `${o.solution}\n\nWhy this works: ${o.reasoning}`;
    }
  }
}

/**
 * LOW-LEVEL PRIMITIVE: generates a response at whatever `req.hintLevel` it is
 * given and does not decide whether that level is allowed. Application code
 * should call `requestHint()` in integration.ts, which chooses the level.
 *
 * Final production flow must authenticate the student and determine the
 * allowed hint level server-side before calling mentor generation. The current
 * POST /api/ai/mentor route remains temporarily compatible for Phase 1 testing
 * until the auth/data layer exists.
 *
 * Produces a mentor response for an already-validated request.
 * Never throws: any failure yields the deterministic fallback.
 * The hint level and mentor reference always come from the application.
 */
export async function getMentorResponse(
  req: MentorRequest,
  generate: typeof generateJson = generateJson,
): Promise<MentorResponse> {
  const level: HintLevel = req.hintLevel;

  // Level 0 is a fixed pushback: no AI call, nothing to leak, no quota spent.
  if (level === 0) {
    return mentorResponseSchema.parse({
      hintLevel: 0,
      response: LEVEL_0_PROMPT,
      source: "fallback",
      fallbackReason: "level_0_deterministic",
    });
  }

  try {
    const raw = await generate(SYSTEM_INSTRUCTION, buildUserPrompt(req));
    const response = composeResponse(level, raw);

    // Block unverified attribution to Vivekananda.
    if (!req.mentorReference && /vivekananda/i.test(response)) {
      return getFallbackResponse(req, "unverified_attribution");
    }

    return mentorResponseSchema.parse({
      hintLevel: level, // authoritative: never taken from Gemini
      response,
      mentorReference: req.mentorReference,
      source: "gemini",
    });
  } catch (err) {
    const reason =
      err instanceof GeminiError ? err.code : "invalid_model_output";
    if (reason !== "missing_api_key") {
      console.error(`[mentor] Gemini failure: ${reason}`);
    }
    return getFallbackResponse(req, reason);
  }
}
