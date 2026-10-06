import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedHintLevel,
  HINT_LEVELS,
  LEVEL_0_PROMPT,
} from "../lib/engines/hint-engine.ts";
import {
  geminiOutputSchemas,
  mentorRequestSchema,
  mentorResponseSchema,
} from "../lib/ai/schemas.ts";
import { getFallbackResponse } from "../lib/ai/fallbacks.ts";
import { getMentorResponse } from "../lib/ai/mentor.ts";
import { buildUserPrompt } from "../lib/ai/prompts.ts";

const base = { task: "Solve 2x + 3 = 11 for x and show the steps.", attempt: "" };
const req = (hintLevel: number, extra = {}) =>
  mentorRequestSchema.parse({ ...base, hintLevel, ...extra });

test("hint engine accepts only integers 0-5", () => {
  for (const l of HINT_LEVELS) assert.equal(getAllowedHintLevel(l), l);
  for (const bad of [-1, 6, 1.5, "2", null, undefined, NaN, Infinity])
    assert.equal(getAllowedHintLevel(bad), null);
});

test("request schema validation", () => {
  assert.ok(mentorRequestSchema.safeParse({ ...base, hintLevel: 2 }).success);
  assert.ok(!mentorRequestSchema.safeParse({ ...base, hintLevel: 7 }).success);
  assert.ok(!mentorRequestSchema.safeParse({ ...base, hintLevel: "2" }).success);
  assert.ok(!mentorRequestSchema.safeParse({ hintLevel: 2 }).success);
  assert.ok(!mentorRequestSchema.safeParse({ ...base, task: "", hintLevel: 2 }).success);
  assert.ok(
    !mentorRequestSchema.safeParse({ ...base, task: "x".repeat(4001), hintLevel: 2 }).success,
  );
  assert.ok(
    !mentorRequestSchema.safeParse({ ...base, hintLevel: 2, dimension: "bad" }).success,
  );
});

test("response schema validation", () => {
  const ok = { hintLevel: 2, response: "hi", source: "gemini" };
  assert.ok(mentorResponseSchema.safeParse(ok).success);
  assert.ok(!mentorResponseSchema.safeParse({ ...ok, hintLevel: 6 }).success);
  assert.ok(!mentorResponseSchema.safeParse({ ...ok, response: "" }).success);
  assert.ok(!geminiOutputSchemas[1].safeParse({ questions: ["not a question"] }).success);
  assert.ok(!geminiOutputSchemas[3].safeParse({ steps: ["only one"] }).success);
});

for (const level of HINT_LEVELS) {
  test(`level ${level}: fallback valid and matches level`, () => {
    const r = getFallbackResponse(req(level), "api_error");
    assert.ok(mentorResponseSchema.safeParse(r).success);
    assert.equal(r.hintLevel, level);
    assert.equal(r.source, "fallback");
  });
  test(`level ${level}: prompt carries the application level`, () => {
    assert.match(buildUserPrompt(req(level)), new RegExp(`HINT LEVEL ${level}, mode: `));
  });
}

test("level 0 returns the fixed pushback without calling Gemini", async () => {
  let called = false;
  const r = await getMentorResponse(req(0), async () => {
    called = true;
    return "{}";
  });
  assert.equal(called, false);
  assert.equal(r.response, LEVEL_0_PROMPT);
});

test("level 5 fallback asks for context when task is too short", () => {
  const r = getFallbackResponse(
    mentorRequestSchema.parse({ task: "help", hintLevel: 5 }),
    "api_error",
  );
  assert.match(r.response, /more task context/);
});

test("missing GEMINI_API_KEY falls back for every level", async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    for (const level of HINT_LEVELS) {
      const r = await getMentorResponse(req(level));
      assert.equal(r.source, "fallback");
      assert.equal(r.hintLevel, level);
    }
    assert.equal((await getMentorResponse(req(2))).fallbackReason, "missing_api_key");
  } finally {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
  }
});

const goodOutput: Record<number, object> = {
  1: { questions: ["What have you tried?"] },
  2: { concept: "Inverse operations", direction: "Undo what was done to x." },
  3: { steps: ["Isolate the term with x", "Divide by its coefficient"] },
  4: { exampleProblem: "3y+1=7", exampleSolution: "3y=6, y=2", howToApply: "Same moves." },
  5: { solution: "x = 4", reasoning: "Subtract 3, divide by 2." },
};

for (const level of [1, 2, 3, 4, 5] as const) {
  test(`level ${level}: valid Gemini output is composed, level is the application's`, async () => {
    // Gemini lies about its level and adds a forbidden "solution" field.
    const lie = { ...goodOutput[level], hintLevel: 5, solution: "x = 4" };
    const r = await getMentorResponse(req(level), async () => JSON.stringify(lie));
    assert.equal(r.source, "gemini");
    assert.equal(r.hintLevel, level);
    assert.ok(mentorResponseSchema.safeParse(r).success);
    if (level < 5) assert.ok(!r.response.includes("x = 4"), "forbidden field leaked");
  });
  test(`level ${level}: output shaped for another level is rejected`, async () => {
    const wrong = goodOutput[level === 5 ? 1 : 5];
    const r = await getMentorResponse(req(level), async () => JSON.stringify(wrong));
    assert.equal(r.source, "fallback");
    assert.equal(r.hintLevel, level);
  });
}

test("fallbacks never exceed their level", () => {
  // Level 1 fallback is a question only; level 5 fallback never solves.
  assert.match(getFallbackResponse(req(1), "x").response, /\?$/);
  assert.doesNotMatch(getFallbackResponse(req(5), "x").response, /x = /);
});

test("malformed Gemini output falls back", async () => {
  for (const bad of ["not json", "{}", '{"questions":[]}']) {
    const r = await getMentorResponse(req(1), async () => bad);
    assert.equal(r.source, "fallback");
    assert.equal(r.fallbackReason, "invalid_model_output");
  }
});

test("unverified Vivekananda attribution is blocked", async () => {
  const gen = async () =>
    JSON.stringify({ concept: "Persistence", direction: "Swami Vivekananda said persist." });
  assert.equal((await getMentorResponse(req(2), gen)).source, "fallback");
  const withRef = req(2, {
    mentorReference: { title: "T", source: "S", excerpt: "E" },
  });
  const r = await getMentorResponse(withRef, gen);
  assert.equal(r.source, "gemini");
  assert.equal(r.mentorReference?.excerpt, "E");
});
