import { LEVEL_0_PROMPT } from "../engines/hint-engine.ts";
import type { MentorRequest, MentorResponse } from "./schemas.ts";

const MIN_CONTEXT_FOR_DIRECT_ANSWER = 20;

/** Deterministic, task-agnostic responses used when Gemini is not available. */
export function getFallbackResponse(
  req: MentorRequest,
  fallbackReason: string,
): MentorResponse {
  const base = {
    hintLevel: req.hintLevel,
    source: "fallback" as const,
    fallbackReason,
  };

  switch (req.hintLevel) {
    case 0:
      return { ...base, response: LEVEL_0_PROMPT };
    case 1:
      return {
        ...base,
        response:
          "What part of the problem is already clear to you, and what do you think it is really asking?",
        nextStep: "Write one sentence describing what the task asks for.",
      };
    case 2:
      return {
        ...base,
        response:
          "Think about which concept or rule from your lessons connects to this task. Identify it first, then see how it applies to what you are given.",
        nextStep: "Name the concept you think is most relevant.",
      };
    case 3:
      return {
        ...base,
        response:
          "Try this: 1) Restate the problem in your own words. 2) List what is given and what is asked. 3) Break it into smaller parts. 4) Work on the first part yourself. 5) Check each part before combining them.",
        nextStep: "Complete steps 1 and 2, then ask again if you are stuck.",
      };
    case 4:
      return {
        ...base,
        response:
          "Example (a different, simpler problem, not your task): to find the area of a 3 by 4 rectangle, identify what is given (3 and 4), recall that area is length times width, then compute 3 x 4 = 12. Now apply the same pattern (identify, recall the rule, compute) to your task.",
        nextStep: "Write out the same three moves for your own task.",
      };
    case 5:
      return req.task.length >= MIN_CONTEXT_FOR_DIRECT_ANSWER
        ? {
            ...base,
            response:
              "The AI mentor is unavailable right now, so I cannot give a reliable direct solution. Please try again in a moment, or ask your teacher for the worked solution.",
            nextStep: "Try again shortly.",
          }
        : {
            ...base,
            response:
              "I need more task context before I can give a direct explanation. Please share the full question or task.",
            nextStep: "Add the complete task text and ask again.",
          };
  }
}
