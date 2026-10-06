/**
 * Deterministic Hint Ladder. No AI, no database, no student history.
 * The application decides the hint level and the response mode; the AI only
 * fills in the fields that mode allows.
 */

export const HINT_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export type HintLevel = (typeof HINT_LEVELS)[number];

export type ResponseMode =
  | "independent_thinking_pushback"
  | "reflective_prompt"
  | "conceptual_hint"
  | "structured_guidance"
  | "worked_example"
  | "direct_solution";

export const LEVEL_0_PROMPT =
  "Before I give you a hint, tell me exactly where you are stuck and what you have tried.";

export const HINT_LEVEL_SPECS: Record<
  HintLevel,
  {
    mode: ResponseMode;
    allowed: string;
    prohibited: string;
    /** JSON the model must return for this level (and nothing else). */
    jsonShape: string;
  }
> = {
  0: {
    mode: "independent_thinking_pushback",
    allowed: "Nothing. This level is handled without AI.",
    prohibited: "Everything.",
    jsonShape: "{}",
  },
  1: {
    mode: "reflective_prompt",
    allowed: "1 to 3 reflective questions that help the learner inspect their own thinking.",
    prohibited:
      "Explanations, concepts, hints, formulas, procedural steps, examples, any part of the answer, and any statement that is not a question.",
    jsonShape: '{"questions": ["question ending with ?", ...]}',
  },
  2: {
    mode: "conceptual_hint",
    allowed: "Name the relevant concept or principle and point the direction of thinking.",
    prohibited:
      "A complete procedure, numbered steps, worked calculations, intermediate results, and the final answer.",
    jsonShape: '{"concept": "short name of the concept", "direction": "1-3 sentences pointing the way"}',
  },
  3: {
    mode: "structured_guidance",
    allowed: "A short ordered list of steps describing what to do at each stage.",
    prohibited:
      "Carrying out the steps, computed values, intermediate results, and the final answer. The learner must do the work.",
    jsonShape: '{"steps": ["step 1", "step 2", ...]}',
  },
  4: {
    mode: "worked_example",
    allowed:
      "A similar but different, simplified example problem, fully worked, then a short note on how to apply the same approach.",
    prohibited:
      "Solving the learner's own task, reusing its numbers or content, and stating its final answer.",
    jsonShape:
      '{"exampleProblem": "a different problem", "exampleSolution": "its worked solution", "howToApply": "how the learner can apply the approach to their own task"}',
  },
  5: {
    mode: "direct_solution",
    allowed: "A direct solution to the learner's task with the reasoning behind it.",
    prohibited: "An unexplained bare answer.",
    jsonShape: '{"solution": "the solution", "reasoning": "why it works"}',
  },
};

export function isHintLevel(value: unknown): value is HintLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
  );
}

/**
 * Validates a requested level. Returns the level if valid, otherwise null
 * (invalid input is rejected, never silently coerced to a different level).
 */
export function getAllowedHintLevel(requested: unknown): HintLevel | null {
  return isHintLevel(requested) ? requested : null;
}

/**
 * Application rule for which level a help request is granted. Pure: callers
 * pass the levels already granted for this task (from the data layer).
 * - Nothing granted yet and the student has not described their attempt: 0.
 * - Otherwise one step above the highest level granted so far, capped at 5.
 * The AI never influences this.
 */
export function nextHintLevel(
  grantedLevels: readonly HintLevel[],
  studentDescribedAttempt: boolean,
): HintLevel {
  if (grantedLevels.length === 0) return studentDescribedAttempt ? 1 : 0;
  const highest = Math.max(...grantedLevels);
  return Math.min(5, highest + 1) as HintLevel;
}

export function getResponseMode(level: HintLevel): ResponseMode {
  return HINT_LEVEL_SPECS[level].mode;
}
