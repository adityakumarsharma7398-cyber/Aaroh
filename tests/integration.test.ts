import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { nextHintLevel, type HintLevel } from "../lib/engines/hint-engine.ts";
import {
  createNoopAdapter,
  recordReflectionSubmitted,
  recordStudentAction,
  requestHint,
  requestMission,
  requestReflection,
  type AIIntegrationAdapter,
  type AppEvent,
} from "../lib/ai/integration.ts";
import { missionSchema } from "../lib/ai/schemas.ts";
import { reflectionSchema } from "../lib/ai/reflection.ts";
import { GeminiError } from "../lib/ai/gemini.ts";

function memoryAdapter(initial: HintLevel[] = []) {
  const events: AppEvent[] = [];
  const adapter: AIIntegrationAdapter = {
    async recordEvent(e) {
      events.push(e);
    },
    async getGrantedHintLevels() {
      return [...initial, ...events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata.level as HintLevel)];
    },
  };
  return { adapter, events };
}
const fail = async () => {
  throw new GeminiError("api_error");
};
const hint = { studentId: "s1", taskId: "t1", task: "Solve 2x + 3 = 11 for x.", attempt: "" };

test("nextHintLevel is deterministic and capped", () => {
  assert.equal(nextHintLevel([], false), 0);
  assert.equal(nextHintLevel([], true), 1);
  assert.equal(nextHintLevel([0], true), 1);
  assert.equal(nextHintLevel([1, 2], true), 3);
  assert.equal(nextHintLevel([5], true), 5);
  assert.equal(nextHintLevel([3, 1], false), 4);
});

test("mission integration returns a validated mission (fallback on AI failure)", async () => {
  const r = await requestMission(
    { academicTask: "Find the largest number in a list", subject: "CS", ageOrGrade: "Grade 9", developmentDimension: "self_reliance" },
    fail,
  );
  assert.equal(r.source, "fallback");
  assert.ok(missionSchema.safeParse(r.mission).success);
});

test("hint flow: application controls the level, Gemini cannot escalate it", async () => {
  const { adapter, events } = memoryAdapter();
  // Gemini output is shaped for level 5; the app granted level 0 first.
  const lie = async () => JSON.stringify({ solution: "x = 4", reasoning: "r", hintLevel: 5 });

  const first = await requestHint(adapter, hint, lie);
  assert.equal(first.hintLevel, 0);

  const second = await requestHint(adapter, { ...hint, attempt: "I tried subtracting" }, lie);
  assert.equal(second.hintLevel, 1);
  assert.equal(second.source, "fallback"); // level-5 shaped output rejected at level 1

  assert.deepEqual(
    events.map((e) => e.type),
    ["hint_requested", "hint_level_granted", "hint_requested", "hint_level_granted"],
  );
  assert.deepEqual(events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata.level), [0, 1]);
  for (const e of events) assert.equal(e.source, "app");
});

test("hint flow works when the AI fails and when the data layer fails", async () => {
  const { adapter } = memoryAdapter([1]);
  const r = await requestHint(adapter, { ...hint, attempt: "tried" }, fail);
  assert.equal(r.hintLevel, 2);
  assert.equal(r.source, "fallback");

  const broken: AIIntegrationAdapter = {
    async recordEvent() {
      throw new Error("db down");
    },
    async getGrantedHintLevels() {
      throw new Error("db down");
    },
  };
  const r2 = await requestHint(broken, { ...hint, attempt: "tried" }, fail);
  assert.equal(r2.hintLevel, 1);
});

test("reflection integration returns validated data and records nothing until submitted", async () => {
  const { adapter, events } = memoryAdapter();
  const r = await requestReflection(
    { academicTask: "Find the largest number", developmentDimension: "problem_solving", attemptSummary: "Sorted, then looped." },
    fail,
  );
  assert.equal(r.source, "fallback");
  assert.ok(reflectionSchema.safeParse(r.reflection).success);
  assert.equal(events.length, 0);

  await recordReflectionSubmitted(adapter, { studentId: "s1", taskId: "t1", dimension: "problem_solving", response: "I changed because..." });
  assert.equal(events[0].type, "reflection");
  assert.equal(events[0].metadata.responseLength, 20);
  assert.ok(!JSON.stringify(events[0]).includes("I changed"), "reflection text must not be stored in the event");
});

test("student action events use the shared event shape", async () => {
  const { adapter, events } = memoryAdapter();
  await recordStudentAction(adapter, { studentId: "s1", taskId: "t1", type: "retry" });
  assert.deepEqual(Object.keys(events[0]).sort(), ["createdAt", "metadata", "source", "studentId", "taskId", "type"]);
  assert.ok(!Number.isNaN(Date.parse(events[0].createdAt)));
});

test("AI integration outputs contain no scores or character judgments", async () => {
  const { adapter } = memoryAdapter();
  const outputs = [
    await requestHint(adapter, hint, fail),
    await requestMission({ academicTask: "t", subject: "s", ageOrGrade: "g", developmentDimension: "perseverance" }, fail),
    await requestReflection({ academicTask: "t", developmentDimension: "initiative", attemptSummary: "a" }, fail),
  ];
  for (const o of outputs) {
    assert.doesNotMatch(JSON.stringify(o), /\b(score|signal|evidence|rating)\b|you are (self-reliant|persistent)|good student/i);
  }
});

test("noop adapter is inert", async () => {
  const a = createNoopAdapter();
  await a.recordEvent({} as AppEvent);
  assert.deepEqual(await a.getGrantedHintLevels("s", "t"), []);
});

test("no event/evidence/signal engine was introduced under lib/ai or lib/engines", () => {
  const files = [...readdirSync("lib/ai"), ...readdirSync("lib/engines")];
  assert.deepEqual(files.filter((f) => /event|evidence|signal/i.test(f)), []);
});

test("end-to-end AI journey: mission -> attempt -> hints -> retry -> reflection", async () => {
  const { adapter, events } = memoryAdapter();
  const ids = { studentId: "s1", taskId: "t1" };
  const outputs: unknown[] = [];

  // Mission (AI unavailable -> deterministic fallback)
  const mission = await requestMission(
    { academicTask: "Write a Python program to find the largest number in a list.", subject: "CS", ageOrGrade: "Grade 9", developmentDimension: "self_reliance" },
    fail,
  );
  assert.ok(missionSchema.safeParse(mission.mission).success);
  outputs.push(mission);

  // Attempt, then a first help request with no description: application grants level 0
  await recordStudentAction(adapter, { ...ids, type: "attempt" });
  const h0 = await requestHint(adapter, { ...ids, task: "Find the largest number in a list.", attempt: "" }, fail);
  assert.equal(h0.hintLevel, 0);

  // Student explains what they tried: application grants level 1, then retries
  const h1 = await requestHint(adapter, { ...ids, task: "Find the largest number in a list.", attempt: "I tried sorting the list" }, fail);
  assert.equal(h1.hintLevel, 1);
  await recordStudentAction(adapter, { ...ids, type: "retry" });
  outputs.push(h0, h1);

  // Reflection, submission, completion
  const reflection = await requestReflection(
    { academicTask: "Find the largest number in a list.", developmentDimension: "self_reliance", attemptSummary: "Tried sorting, asked for help, retried with a loop.", outcome: "completed" },
    fail,
  );
  assert.ok(reflectionSchema.safeParse(reflection.reflection).success);
  outputs.push(reflection);
  await recordReflectionSubmitted(adapter, { ...ids, dimension: "self_reliance", response: "I worked out the loop myself." });
  await recordStudentAction(adapter, { ...ids, type: "completed" });

  assert.deepEqual(events.map((e) => e.type), [
    "attempt", "hint_requested", "hint_level_granted", "hint_requested", "hint_level_granted", "retry", "reflection", "completed",
  ]);
  assert.deepEqual(events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata.level), [0, 1]);

  // Nothing in the journey scores, concludes or judges
  assert.doesNotMatch(
    JSON.stringify({ outputs, events }),
    /\b(score|rating|signal|evidence|verdict)\b|you are (self-reliant|persistent)|good (student|character)|bad (student|character)/i,
  );
});
