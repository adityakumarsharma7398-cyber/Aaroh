import { test } from "node:test";
import assert from "node:assert/strict";
import { DIMENSIONS, missionRequestSchema, missionSchema } from "../lib/ai/schemas.ts";
import { MISSION_FALLBACKS } from "../lib/ai/fallbacks.ts";
import {
  generateMission,
  handleMissionRequest,
  violatesMissionSafety,
} from "../lib/ai/mission.ts";
import { GeminiError } from "../lib/ai/gemini.ts";
import { POST } from "../app/api/ai/mission/route.ts";

const valid = {
  academicTask: "Write a Python program to find the largest number in a list.",
  subject: "Computer Science",
  ageOrGrade: "Grade 9",
  developmentDimension: "self_reliance",
};
const goodMission = {
  title: "First Try",
  challenge: "Write the program yourself first.",
  focus: "Start with your own reasoning.",
  instructions: ["Try it alone.", "Explain your approach."],
  reflection: "What did you work out yourself?",
};
const post = (body: string) =>
  POST(new Request("http://x/api/ai/mission", { method: "POST", body }));

test("request schema accepts all five dimensions", () => {
  for (const d of DIMENSIONS)
    assert.ok(missionRequestSchema.safeParse({ ...valid, developmentDimension: d }).success);
});

for (const field of ["academicTask", "subject", "ageOrGrade"]) {
  test(`missing ${field} is rejected`, () => {
    const rest: Record<string, string> = { ...valid };
    delete rest[field];
    assert.ok(!missionRequestSchema.safeParse(rest).success);
    assert.ok(!missionRequestSchema.safeParse({ ...rest, [field]: "  " }).success);
  });
}

test("invalid developmentDimension is rejected", () => {
  assert.ok(!missionRequestSchema.safeParse({ ...valid, developmentDimension: "grit" }).success);
});

test("mission output schema: valid accepted, malformed rejected", () => {
  assert.ok(missionSchema.safeParse(goodMission).success);
  assert.ok(missionSchema.safeParse({ ...goodMission, reflection: null }).success);
  assert.ok(!missionSchema.safeParse({ ...goodMission, instructions: ["one"] }).success);
  assert.ok(!missionSchema.safeParse({ ...goodMission, title: "" }).success);
  assert.ok(!missionSchema.safeParse({ title: "x" }).success);
});

for (const d of DIMENSIONS) {
  test(`fallback for ${d} is valid and safe`, () => {
    const m = MISSION_FALLBACKS[d];
    assert.ok(missionSchema.safeParse(m).success);
    assert.equal(violatesMissionSafety(m), false);
  });
}

test("sustained_engagement fallback has no attention/concentration scoring", () => {
  const text = JSON.stringify(MISSION_FALLBACKS.sustained_engagement);
  assert.doesNotMatch(text, /attention|concentrat|webcam|camera|eye|score|percent/i);
});

test("safety check catches scoring, surveillance and invented attribution", () => {
  for (const bad of [
    "Your character score will be shown",
    "You are self-reliant",
    "How self-reliant were you?",
    "Keep eye contact with the screen",
    "Swami Vivekananda said work hard",
    "Your attention percentage",
  ])
    assert.ok(violatesMissionSafety({ ...goodMission, challenge: bad }), bad);
});

test("invalid input returns 400 from the route", async () => {
  for (const body of ["not json", "{}", JSON.stringify({ ...valid, developmentDimension: "x" })]) {
    const res = await post(body);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { success: false, error: "Invalid mission request" });
  }
});

test("route without API key returns a fallback mission with 200", async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const res = await post(JSON.stringify({ ...valid, developmentDimension: "perseverance" }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.source, "fallback");
    assert.deepEqual(json.mission, MISSION_FALLBACKS.perseverance);
  } finally {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
  }
});

test("provider failure produces a valid fallback", async () => {
  for (const code of ["api_error", "rate_limited", "timeout"] as const) {
    const r = await generateMission(valid as never, async () => {
      throw new GeminiError(code);
    });
    assert.equal(r.source, "fallback");
    assert.ok(missionSchema.safeParse(r.mission).success);
  }
});

test("malformed or unsafe Gemini output falls back", async () => {
  for (const raw of ["nope", "{}", JSON.stringify({ ...goodMission, challenge: "Prove you are focused" })]) {
    const r = await generateMission(valid as never, async () => raw);
    assert.equal(r.source, "fallback");
  }
});

test("valid Gemini output is used and never exposes a score", async () => {
  const raw = JSON.stringify({ ...goodMission, characterScore: 9, score: 80, dimension: "x" });
  const { status, body } = await handleMissionRequest(valid, async () => raw);
  assert.equal(status, 200);
  const r = body as { source: string; mission: Record<string, unknown> };
  assert.equal(r.source, "gemini");
  assert.deepEqual(Object.keys(r.mission).sort(), ["challenge", "focus", "instructions", "reflection", "title"]);
  assert.doesNotMatch(JSON.stringify(r), /score/i);
});
