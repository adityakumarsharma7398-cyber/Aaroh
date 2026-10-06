import { z } from "zod";
import { HINT_LEVELS, type HintLevel } from "../engines/hint-engine.ts";

export const DIMENSIONS = [
  "self_reliance",
  "perseverance",
  "problem_solving",
  "initiative",
  "sustained_engagement",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

const hintLevelSchema = z
  .number()
  .int()
  .refine((n): n is HintLevel => (HINT_LEVELS as readonly number[]).includes(n), {
    message: "hintLevel must be an integer from 0 to 5",
  });

/** Verified reference supplied by the application (never by the AI). */
export const mentorReferenceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  source: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().min(1).max(1500),
});
export type MentorReference = z.infer<typeof mentorReferenceSchema>;

export const mentorRequestSchema = z.object({
  task: z.string().trim().min(1).max(4000),
  attempt: z.string().trim().max(4000).default(""),
  hintLevel: hintLevelSchema,
  dimension: z.enum(DIMENSIONS).optional(),
  mentorReference: mentorReferenceSchema.optional(),
});
export type MentorRequest = z.infer<typeof mentorRequestSchema>;

/**
 * What Gemini may return, per level (levels 1-5). Each level's schema only has
 * fields for the help that level allows, so an over-helpful field (e.g. a
 * "solution" at level 2) is dropped by Zod. Level and reference are NOT part
 * of it; the application composes the final text.
 */
const text = (max: number) => z.string().trim().min(1).max(max);

export const geminiOutputSchemas = {
  1: z.object({
    questions: z
      .array(text(500).refine((q) => q.endsWith("?"), "must be a question"))
      .min(1)
      .max(3),
  }),
  2: z.object({ concept: text(200), direction: text(800) }),
  3: z.object({ steps: z.array(text(400)).min(2).max(8) }),
  4: z.object({
    exampleProblem: text(800),
    exampleSolution: text(1500),
    howToApply: text(600),
  }),
  5: z.object({ solution: text(3000), reasoning: text(3000) }),
} as const;

export type GeminiLevel = keyof typeof geminiOutputSchemas;

/** What the client receives. Level and reference are set by the application. */
export const mentorResponseSchema = z.object({
  hintLevel: hintLevelSchema,
  response: z.string().trim().min(1),
  nextStep: z.string().optional(),
  mentorReference: mentorReferenceSchema.optional(),
  source: z.enum(["gemini", "fallback"]),
  fallbackReason: z.string().optional(),
});
export type MentorResponse = z.infer<typeof mentorResponseSchema>;

// ─── Phase 1B: Growth Missions ───────────────────────────────────────────────

export const missionRequestSchema = z.object({
  academicTask: z.string().trim().min(1).max(2000),
  subject: z.string().trim().min(1).max(100),
  ageOrGrade: z.string().trim().min(1).max(50),
  developmentDimension: z.enum(DIMENSIONS),
});
export type MissionRequest = z.infer<typeof missionRequestSchema>;

/**
 * A Growth Mission creates a condition for observable behavior. It never holds
 * scores, labels or evidence; unknown keys (e.g. a "score") are stripped.
 */
export const missionSchema = z.object({
  title: text(80),
  challenge: text(400),
  focus: text(300),
  instructions: z.array(text(300)).min(2).max(5),
  reflection: text(300).nullable(),
});
export type Mission = z.infer<typeof missionSchema>;

export type MissionResponse = {
  success: true;
  mission: Mission;
  source: "gemini" | "fallback";
};
