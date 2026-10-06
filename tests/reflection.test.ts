import { test } from "node:test";
import assert from "node:assert/strict";
import { DIMENSIONS } from "../lib/ai/schemas.ts";
import {
  generateReflection,
  handleReflectionRequest,
  REFLECTION_FALLBACKS,
  reflectionRequestSchema,
  reflectionSchema,
  violatesReflectionSafety,
} from "../lib/ai/reflection.ts";
import { GeminiError } from "../lib/ai/gemini.ts";
import { POST } from "../app/api/ai/reflection/route.ts";

const valid = {
  academicTask: "Write a Python program to find the largest number in a list.",
  developmentDimension: "problem_solving",
  attemptSummary: "First used sorting, then changed to a loop.",
  outcome: "completed",
};
const good = {
  prompt: "What made you decide to switch from sorting to a loop?",
  followUp: "What did you learn from comparing the two approaches?",
};
const post = (body: string) =>
  POST(new Request("http://x/api/ai/reflection", { method: "POST", body }));

test("valid request accepted; outcome is optional", () => {
  assert.ok(reflectionRequestSchema.safeParse(valid).success);
  const { outcome: _o, ...noOutcome } = valid;
  void _o;
  assert.ok(reflectionRequestSchema.safeParse(noOutcome).success);
  for (const d of DIMENSIONS)
    assert.ok(reflectionRequestSchema.safeParse({ ...valid, developmentDimension: d }).success);
});

test("missing academicTask / attemptSummary / bad dimension rejected", () => {
  assert.ok(!reflectionRequestSchema.safeParse({ ...valid, academicTask: undefined }).success);
  assert.ok(!reflectionRequestSchema.safeParse({ ...valid, attemptSummary: undefined }).success);
  assert.ok(!reflectionRequestSchema.safeParse({ ...valid, attemptSummary: "  " }).success);
  assert.ok(!reflectionRequestSchema.safeParse({ ...valid, developmentDimension: "grit" }).success);
});

test("output schema: valid accepted, followUp may be null or missing, invalid rejected", () => {
  assert.ok(reflectionSchema.safeParse(good).success);
  assert.equal(reflectionSchema.parse({ prompt: good.prompt }).followUp, null);
  assert.equal(reflectionSchema.parse({ prompt: good.prompt, followUp: null }).followUp, null);
  assert.ok(!reflectionSchema.safeParse({ prompt: "You did well." }).success);
  assert.ok(!reflectionSchema.safeParse({ prompt: "" }).success);
  assert.ok(!reflectionSchema.safeParse({}).success);
});

for (const d of DIMENSIONS) {
  test(`fallback for ${d} is valid and safe`, () => {
    const r = REFLECTION_FALLBACKS[d];
    assert.ok(reflectionSchema.safeParse(r).success);
    assert.equal(violatesReflectionSafety(r), false);
    assert.doesNotMatch(JSON.stringify(r), /character|personality|score|rate|attention|concentrat|webcam|camera|eye|vivekananda/i);
  });
}

test("safety check catches scoring, labels, self-rating, surveillance, attribution", () => {
  for (const bad of [
    "What is your character score?",
    "How persistent were you?",
    "Rate your self-reliance from 1-10?",
    "Did you demonstrate strong character?",
    "Are you a good problem solver?",
    "You showed excellent perseverance, what next?",
    "What was your attention score?",
    "Did the webcam see you work?",
    "Did you keep eye contact with the screen?",
    "What would Swami Vivekananda say?",
  ])
    assert.ok(violatesReflectionSafety({ prompt: bad, followUp: null }), bad);
});

test("valid Gemini output used; extra score fields stripped", async () => {
  const raw = JSON.stringify({ ...good, score: 9, characterScore: 1, dimension: "x" });
  const r = await generateReflection(valid as never, async () => raw);
  assert.equal(r.source, "gemini");
  assert.deepEqual(Object.keys(r.reflection).sort(), ["followUp", "prompt"]);
  assert.doesNotMatch(JSON.stringify(r), /score/i);
});

test("invalid or unsafe output falls back", async () => {
  for (const raw of ["nope", "{}", JSON.stringify({ prompt: "You are persistent." }), JSON.stringify({ prompt: "How persistent were you?" })]) {
    const r = await generateReflection(valid as never, async () => raw);
    assert.equal(r.source, "fallback");
    assert.deepEqual(r.reflection, REFLECTION_FALLBACKS.problem_solving);
  }
});

test("provider failure returns fallback", async () => {
  for (const code of ["api_error", "rate_limited", "timeout"] as const) {
    const r = await generateReflection(valid as never, async () => {
      throw new GeminiError(code);
    });
    assert.equal(r.source, "fallback");
  }
});

test("handler: invalid -> 400, valid -> 200", async () => {
  assert.equal((await handleReflectionRequest({})).status, 400);
  assert.equal((await handleReflectionRequest(valid, async () => JSON.stringify(good))).status, 200);
});

test("API route: invalid input returns 400", async () => {
  for (const body of ["not json", "{}", JSON.stringify({ ...valid, developmentDimension: "x" })]) {
    const res = await post(body);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { success: false, error: "Invalid reflection request" });
  }
});

test("API route: no API key returns 200 fallback", async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const res = await post(JSON.stringify(valid));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.source, "fallback");
    assert.deepEqual(json.reflection, REFLECTION_FALLBACKS.problem_solving);
  } finally {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
  }
});
