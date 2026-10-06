import { LEVEL_0_PROMPT } from "../engines/hint-engine.ts";
import type {
  Dimension,
  MentorRequest,
  MentorResponse,
  Mission,
} from "./schemas.ts";

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

// ─── Phase 1B: Growth Missions ───────────────────────────────────────────────

/** Generic, deterministic missions (any subject). They never score the student. */
export const MISSION_FALLBACKS: Record<Dimension, Mission> = {
  self_reliance: {
    title: "First Try",
    challenge: "Build your first approach before asking for a solution.",
    focus: "Start with your own reasoning, then use help to move forward.",
    instructions: [
      "Try the task on your own first.",
      "Write down or explain what you think is happening.",
      "If you get stuck, identify the exact point where you are stuck before asking for help.",
      "After receiving guidance, try the task again yourself.",
    ],
    reflection:
      "What did you figure out on your own, and what changed after you received help?",
  },
  perseverance: {
    title: "Second Wind",
    challenge:
      "Keep working on the task after your first approach runs into trouble.",
    focus: "Stay with the problem after your first approach does not work.",
    instructions: [
      "Make an attempt at the task.",
      "If it does not work, write down what went wrong.",
      "Change one thing and try again.",
      "Keep going until you complete the task or make clear progress, and note how far you got.",
    ],
    reflection:
      "What did you change after the first try, and what did it teach you?",
  },
  problem_solving: {
    title: "Plan B",
    challenge:
      "Plan an approach, test it, and switch strategy if it does not work.",
    focus: "Try a different strategy when your first one does not work.",
    instructions: [
      "In a sentence or two, say what the problem is asking.",
      "Choose an approach and try it.",
      "If it fails, say why it failed.",
      "Pick a different approach and explain how it differs from the first.",
    ],
    reflection:
      "Why did you choose your approach, and what made the second one different?",
  },
  initiative: {
    title: "One Step Further",
    challenge:
      "Complete the task, then make one meaningful improvement of your own choosing.",
    focus: "Make a thoughtful choice that improves your work on this task.",
    instructions: [
      "Complete the core task first.",
      "Choose one way to improve or extend your work, such as a clearer method or an extra check.",
      "Try your idea.",
      "Write one sentence on why you chose it.",
    ],
    reflection: "What did you decide to add, and why did you choose it?",
  },
  sustained_engagement: {
    title: "Finish the Block",
    challenge: "Work through one clear section of the task from start to finish.",
    focus: "Stay with one defined part of the task until it is done.",
    instructions: [
      "Pick one clear section of the task to complete.",
      "Work on it until that section is finished.",
      "Write down what you completed.",
    ],
    reflection: "What helped you keep going with this section?",
  },
};
