import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { nextHintLevel, type HintLevel } from "../lib/engines/hint-engine.ts";
import {
  createNoopAdapter,
  grantedLevelsFromEvents,
  requestHintForTask,
  toBackendMissionDraft,
  recordReflectionSubmitted,
  recordStudentAction,
  requestHint,
  requestMission,
  requestReflection,
  type AIIntegrationAdapter,
  type AppEvent,
} from "../lib/ai/integration.ts";
import { clientHintRequestSchema, missionSchema } from "../lib/ai/schemas.ts";
import { EVENT_SOURCES, EVENT_TYPES } from "../../shared/src/types/event.ts";
import { reflectionSchema } from "../lib/ai/reflection.ts";
import { GeminiError } from "../lib/ai/gemini.ts";

function memoryAdapter(initial: HintLevel[] = []) {
  const events: AppEvent[] = [];
  const adapter: AIIntegrationAdapter = {
    async recordEvent(e) {
      events.push(e as AppEvent);
    },
    async getStudentTaskEvents() {
      const prior = initial.map((level) => ({ type: "hint_level_granted" as const, metadata: { level } }));
      return [...prior, ...events.map((e) => ({ type: e.type, metadata: e.metadata ?? {} }))];
    },
    async getTask(taskId) {
      return taskId === "t1"
        ? { id: "t1", title: "Linear equations", subject: "Math", description: "Solve 2x + 3 = 11 for x." }
        : null;
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
  assert.deepEqual(events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata?.level), [0, 1]);
  // Backend convention: student-initiated actions are "student", application decisions are "app"
  assert.deepEqual(events.map((e) => e.source), ["student", "app", "student", "app"]);
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
    async getStudentTaskEvents() {
      throw new Error("db down");
    },
    async getTask() {
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
  // The student's text is user data: it goes to the backend as metadata.note (backend convention)
  assert.equal(events[0].metadata?.note, "I changed because...");
  assert.equal(events[0].source, "student");
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
  assert.deepEqual(await a.getStudentTaskEvents("s", "t"), []);
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
  assert.deepEqual(events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata?.level), [0, 1]);

  // Nothing in the journey scores, concludes or judges
  assert.doesNotMatch(
    JSON.stringify({ outputs, events }),
    /\b(score|rating|signal|evidence|verdict)\b|you are (self-reliant|persistent)|good (student|character)|bad (student|character)/i,
  );
});

// ─── Backend contract (shared/ event contract, server/ functions) ────────────

test("client hint request cannot carry a level or an identity", () => {
  assert.ok(clientHintRequestSchema.safeParse({ taskId: "t1" }).success);
  assert.ok(clientHintRequestSchema.safeParse({ taskId: "t1", attempt: "tried", dimension: "perseverance" }).success);
  for (const extra of [{ hintLevel: 5 }, { level: 4 }, { requestedLevel: 4 }, { studentId: "other" }])
    assert.ok(!clientHintRequestSchema.safeParse({ taskId: "t1", ...extra }).success, JSON.stringify(extra));
  assert.ok(!clientHintRequestSchema.safeParse({ attempt: "x" }).success);
});

test("grantedLevelsFromEvents reads backend hint_level_granted events and ignores junk", () => {
  const events = [
    { type: "hint_level_granted" as const, metadata: { level: 2 } },
    { type: "hint_level_granted" as const, metadata: { level: 9 } },
    { type: "hint_level_granted" as const, metadata: { level: "4" } },
    { type: "hint_level_granted" as const, metadata: {} },
    { type: "hint_requested" as const, metadata: { requestedLevel: 5 } }, // client-requested level is ignored
  ];
  assert.deepEqual(grantedLevelsFromEvents(events), [2]);
});

test("trusted hint path: level comes from stored history, task text from the backend", async () => {
  const { adapter, events } = memoryAdapter();
  const lie = async () => JSON.stringify({ solution: "x = 4", reasoning: "r" });
  const levels: number[] = [];
  for (const attempt of ["I tried subtracting", "still stuck", "again"]) {
    const r = await requestHintForTask(adapter, { studentId: "s1", taskId: "t1", attempt }, lie);
    assert.ok(r.ok);
    if (r.ok) levels.push(r.data.hintLevel);
  }
  assert.deepEqual(levels, [1, 2, 3]); // escalates one step at a time, never chosen by the caller or by Gemini
  assert.deepEqual(
    events.filter((e) => e.type === "hint_level_granted").map((e) => e.metadata?.level),
    [1, 2, 3],
  );
});

test("unknown task: nothing is generated and no event is recorded", async () => {
  const { adapter, events } = memoryAdapter();
  const r = await requestHintForTask(adapter, { studentId: "s1", taskId: "missing", attempt: "x" }, fail);
  assert.deepEqual(r, { ok: false, error: "task_not_found" });
  assert.equal(events.length, 0);
});

test("every event the AI emits uses the backend shared event vocabulary", async () => {
  const { adapter, events } = memoryAdapter();
  await recordStudentAction(adapter, { studentId: "s1", taskId: "t1", type: "attempt" });
  await requestHint(adapter, { ...hint, attempt: "tried" }, fail);
  await recordStudentAction(adapter, { studentId: "s1", taskId: "t1", type: "retry" });
  await recordReflectionSubmitted(adapter, { studentId: "s1", taskId: "t1", dimension: "initiative", response: "I added a check." });
  await recordStudentAction(adapter, { studentId: "s1", taskId: "t1", type: "completed", metadata: { success: true } });
  assert.ok(events.length >= 6);
  for (const e of events) {
    assert.ok((EVENT_TYPES as readonly string[]).includes(e.type), e.type);
    assert.ok((EVENT_SOURCES as readonly string[]).includes(e.source), e.source);
    assert.notEqual(e.source, "teacher"); // teacher events are never emitted by the AI flow
  }
  assert.equal(events.at(-1)?.metadata?.success, true); // completed.success is what the backend rules read
});

test("mission maps onto the backend Mission row without scores or extra fields", async () => {
  const m = await requestMission({ academicTask: "Find the largest number", subject: "CS", ageOrGrade: "Grade 9", developmentDimension: "perseverance" }, fail);
  const draft = toBackendMissionDraft(m.mission, { taskId: "t1", studentId: "s1", dimension: "perseverance" });
  assert.deepEqual(Object.keys(draft).sort(), ["dimensions", "instruction", "studentId", "taskId"]);
  assert.deepEqual(draft.dimensions, ["perseverance"]);
  assert.match(draft.instruction, /1\. /);
  assert.doesNotMatch(JSON.stringify(draft), /\b(score|signal|evidence)\b/i);
});
