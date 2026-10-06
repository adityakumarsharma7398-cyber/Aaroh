import assert from "node:assert/strict";
import {
  generateEvidence,
  evaluateSelfReliance,
  evaluatePerseverance,
  evaluateProblemSolving,
  evaluateInitiative,
  evaluateSustainedEngagement,
  persistEvidence,
  getStudentEvidence,
} from "./evidence";
import { db } from "../db/client";
import { profiles, tasks, events, evidence } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import type { ObservableEvent } from "@education-growth/shared";

async function runEvidenceVerification() {
  console.log("=== Starting Deterministic Evidence Engine Verification ===");

  const studentId = "student-evidence-test";
  const now = Date.now();

  // Helper to make test events
  const makeEvent = (
    id: string,
    type: ObservableEvent["type"],
    source: ObservableEvent["source"],
    taskId: string | null,
    metadata: Record<string, unknown> = {},
    offsetSeconds: number = 0
  ): ObservableEvent => ({
    id,
    studentId,
    taskId,
    type,
    source,
    metadata,
    createdAt: new Date(now + offsetSeconds * 1000).toISOString(),
  });

  // -------------------------------------------------------------------------
  // TEST 1: Self-Reliance (SR-01) with 3 comparable tasks: hint levels 4 -> 3 -> 2
  // -------------------------------------------------------------------------
  console.log("\n1. Testing Self-Reliance (SR-01) with decreasing hints across 3 tasks (4 -> 3 -> 2)...");
  const srEvents3Tasks: ObservableEvent[] = [
    // Task A: hint level 4, completed
    makeEvent("ev-t1-hint", "hint_level_granted", "app", "task-a", { level: 4 }, 10),
    makeEvent("ev-t1-comp", "completed", "app", "task-a", { success: true }, 20),
    // Task B: hint level 3, completed
    makeEvent("ev-t2-hint", "hint_level_granted", "app", "task-b", { level: 3 }, 30),
    makeEvent("ev-t2-comp", "completed", "app", "task-b", { success: true }, 40),
    // Task C: hint level 2, completed
    makeEvent("ev-t3-hint", "hint_level_granted", "app", "task-c", { level: 2 }, 50),
    makeEvent("ev-t3-comp", "completed", "app", "task-c", { success: true }, 60),
  ];

  const srEvidence = evaluateSelfReliance(srEvents3Tasks);
  assert.equal(srEvidence.length, 1, "Expected exactly 1 SR-01 evidence record");
  assert.equal(srEvidence[0].ruleId, "SR-01");
  assert.equal(srEvidence[0].dimension, "self_reliance");
  assert.equal(srEvidence[0].strength, "strengthening");
  assert.equal(
    srEvidence[0].summary,
    "Across 3 comparable tasks, the highest hint level decreased from 4 to 2 while the tasks were completed."
  );
  assert.equal(srEvidence[0].supportingEventIds.length, 6);
  console.log("   ✓ SR-01 evidence generated successfully with strength 'strengthening'");
  console.log(`   Summary: "${srEvidence[0].summary}"`);

  // -------------------------------------------------------------------------
  // TEST 2: Self-Reliance with only 1 task -> must NOT claim development
  // -------------------------------------------------------------------------
  console.log("\n2. Testing Self-Reliance with only 1 task (insufficient data: must NOT claim development)...");
  const srEvents1Task: ObservableEvent[] = [
    makeEvent("ev-single-hint", "hint_level_granted", "app", "task-single", { level: 4 }, 10),
    makeEvent("ev-single-comp", "completed", "app", "task-single", { success: true }, 20),
  ];
  const srSingleEvidence = evaluateSelfReliance(srEvents1Task);
  assert.equal(
    srSingleEvidence.length,
    0,
    "Expected 0 evidence records claiming development for single task"
  );
  console.log("   ✓ Single task correctly produces no development claim (threshold >= 3 comparable tasks)");

  // -------------------------------------------------------------------------
  // TEST 3: Perseverance (PE-01): failed attempt -> retry -> completion
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Perseverance (PE-01): failed attempt -> retry -> completion...");
  const peEvents: ObservableEvent[] = [
    makeEvent("ev-pe-att1", "attempt", "app", "task-pe", { result: "failed", attemptNumber: 1 }, 10),
    makeEvent("ev-pe-retry", "retry", "app", "task-pe", { afterFailure: true }, 20),
    makeEvent("ev-pe-comp", "completed", "app", "task-pe", { success: true }, 30),
  ];
  const peEvidence = evaluatePerseverance(peEvents);
  assert.equal(peEvidence.length, 1, "Expected exactly 1 PE-01 evidence record");
  assert.equal(peEvidence[0].ruleId, "PE-01");
  assert.equal(peEvidence[0].dimension, "perseverance");
  assert.equal(peEvidence[0].strength, "developing");
  assert.equal(
    peEvidence[0].summary,
    "The student retried after an unsuccessful attempt and subsequently completed the task."
  );
  assert.deepEqual(peEvidence[0].supportingEventIds, ["ev-pe-att1", "ev-pe-retry", "ev-pe-comp"]);
  console.log("   ✓ PE-01 evidence generated with supporting event IDs");
  console.log(`   Summary: "${peEvidence[0].summary}"`);

  // -------------------------------------------------------------------------
  // TEST 4: Problem Solving (PS-01): attempt -> feedback -> retry -> completion
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Problem Solving (PS-01): attempt -> feedback -> retry -> completion...");
  const psEvents: ObservableEvent[] = [
    makeEvent("ev-ps-att", "attempt", "app", "task-ps", { attemptNumber: 1 }, 10),
    makeEvent("ev-ps-feed", "feedback_applied", "app", "task-ps", { feedbackType: "syntax_guide" }, 20),
    makeEvent("ev-ps-retry", "retry", "app", "task-ps", { changedApproach: true }, 30),
    makeEvent("ev-ps-comp", "completed", "app", "task-ps", { success: true }, 40),
  ];
  const psEvidence = evaluateProblemSolving(psEvents);
  assert.equal(psEvidence.length, 1, "Expected exactly 1 PS-01 evidence record");
  assert.equal(psEvidence[0].ruleId, "PS-01");
  assert.equal(psEvidence[0].dimension, "problem_solving");
  assert.equal(
    psEvidence[0].summary,
    "After feedback was applied, the student retried and subsequently completed the task."
  );
  assert.deepEqual(psEvidence[0].supportingEventIds, [
    "ev-ps-att",
    "ev-ps-feed",
    "ev-ps-retry",
    "ev-ps-comp",
  ]);
  console.log("   ✓ PS-01 evidence generated without subjective claims");
  console.log(`   Summary: "${psEvidence[0].summary}"`);

  // -------------------------------------------------------------------------
  // TEST 5: Initiative (IN-01): teacher observation with optional extension
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Initiative (IN-01) with explicit teacher observation...");
  const inEvents: ObservableEvent[] = [
    makeEvent("ev-in-obs", "teacher_observation", "teacher", "task-in", {
      category: "optional_extension_completed",
      note: "student completed an optional extension beyond the required task.",
    }),
  ];
  const inEvidence = evaluateInitiative(inEvents);
  assert.equal(inEvidence.length, 1, "Expected exactly 1 IN-01 evidence record");
  assert.equal(inEvidence[0].ruleId, "IN-01");
  assert.equal(inEvidence[0].dimension, "initiative");
  assert.equal(
    inEvidence[0].summary,
    "Teacher-observed: student completed an optional extension beyond the required task."
  );
  assert.deepEqual(inEvidence[0].supportingEventIds, ["ev-in-obs"]);
  console.log("   ✓ IN-01 evidence generated from explicit observable event");

  // -------------------------------------------------------------------------
  // TEST 6: Initiative negative check: no supporting observation -> NO evidence
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Initiative negative check (no supporting observation)...");
  const noInEvents: ObservableEvent[] = [
    makeEvent("ev-fast-comp", "completed", "app", "task-in", { speed: "very_fast", score: 100 }),
  ];
  const noInEvidence = evaluateInitiative(noInEvents);
  assert.equal(noInEvidence.length, 0, "Fast completion or high score must NOT infer initiative");
  console.log("   ✓ Correctly avoided inferring initiative from fast completion or score");

  // -------------------------------------------------------------------------
  // TEST 7: Sustained Engagement (SE-01): positive multi-action session
  // -------------------------------------------------------------------------
  console.log("\n7. Testing Sustained Engagement (SE-01) with observable multi-action session...");
  const seMultiEvents: ObservableEvent[] = [
    makeEvent("ev-se-att1", "attempt", "app", "task-se", { attemptNumber: 1 }, 10),
    makeEvent("ev-se-feed", "feedback_applied", "app", "task-se", { tip: "check formula" }, 20),
    makeEvent("ev-se-retry", "retry", "app", "task-se", { attemptNumber: 2 }, 30),
    makeEvent("ev-se-ref", "reflection", "student", "task-se", { note: "rechecked variables" }, 40),
  ];
  const sePositiveEvidence = evaluateSustainedEngagement(seMultiEvents);
  assert.equal(sePositiveEvidence.length, 1, "Expected exactly 1 SE-01 record for multi-action session");
  assert.equal(sePositiveEvidence[0].ruleId, "SE-01");
  assert.equal(sePositiveEvidence[0].dimension, "sustained_engagement");
  assert.equal(sePositiveEvidence[0].strength, "developing");
  assert.ok(
    !sePositiveEvidence[0].summary.includes("concentration"),
    "Summary must never claim concentration"
  );
  assert.equal(sePositiveEvidence[0].supportingEventIds.length, 4);
  console.log("   ✓ SE-01 evidence generated from observable actions without claiming concentration");
  console.log(`   Summary: "${sePositiveEvidence[0].summary}"`);

  // -------------------------------------------------------------------------
  // TEST 8: Sustained Engagement (SE-01): insufficient data -> NO claim of concentration
  // -------------------------------------------------------------------------
  console.log("\n8. Testing Sustained Engagement negative check (insufficient data)...");
  const sparseEvents: ObservableEvent[] = [
    makeEvent("ev-sparse-att", "attempt", "app", "task-se-sparse", { attemptNumber: 1 }),
  ];
  const seEvidence = evaluateSustainedEngagement(sparseEvents);
  assert.equal(seEvidence.length, 0, "Sparse events must NOT generate sustained engagement claims");
  console.log("   ✓ Correctly avoided making unobservable concentration claims on sparse data");

  // -------------------------------------------------------------------------
  // TEST 9: Every evidence record contains valid supporting event IDs
  // -------------------------------------------------------------------------
  console.log("\n9. Verifying all generated evidence records contain traceable event IDs...");
  const combinedEvents: ObservableEvent[] = [
    ...srEvents3Tasks,
    ...peEvents,
    ...psEvents,
    ...inEvents,
    ...seMultiEvents,
  ];
  const allEvidence = generateEvidence(combinedEvents);
  assert.ok(allEvidence.length >= 5, "Expected all 5 dimensions represented in combined stream");

  for (const record of allEvidence) {
    assert.ok(record.id.startsWith("ev-"), "Record ID must be prefixed with ev-");
    assert.ok(record.supportingEventIds.length > 0, "Evidence record MUST contain supporting event IDs");
    for (const eventId of record.supportingEventIds) {
      const exists = combinedEvents.some((e) => e.id === eventId);
      assert.ok(exists, `Supporting event ID '${eventId}' must exist in input event stream`);
    }
  }
  console.log(`   ✓ All ${allEvidence.length} evidence records trace back to existing event IDs`);

  // -------------------------------------------------------------------------
  // TEST 10: Pure deterministic logic: same events -> exact same output
  // -------------------------------------------------------------------------
  console.log("\n10. Verifying pure determinism (same events -> exact same output)...");
  const run1 = generateEvidence(combinedEvents);
  const run2 = generateEvidence(combinedEvents);
  assert.deepEqual(run1, run2, "Different runs with same input must return identical evidence objects");
  console.log("   ✓ Determinism verified: 100% identical outputs and IDs across runs");

  // -------------------------------------------------------------------------
  // TEST 11: Database persistence & retrieval
  // -------------------------------------------------------------------------
  console.log("\n11. Testing evidence persistence to SQLite database...");
  // Setup prerequisites in DB for foreign keys
  await db.insert(profiles).values({
    id: studentId,
    name: "Evidence Test Student",
    role: "student",
    createdAt: new Date().toISOString(),
  });

  await db.insert(tasks).values([
    {
      id: "task-pe",
      title: "Task PE",
      subject: "Math",
      description: "Desc",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-ps",
      title: "Task PS",
      subject: "Math",
      description: "Desc",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-in",
      title: "Task IN",
      subject: "Math",
      description: "Desc",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-se",
      title: "Task SE",
      subject: "Math",
      description: "Desc",
      createdAt: new Date().toISOString(),
    },
  ]);

  try {
    const persisted = await persistEvidence(allEvidence);
    assert.equal(persisted.length, allEvidence.length);

    const retrieved = await getStudentEvidence(studentId);
    assert.equal(retrieved.length, allEvidence.length);
    console.log(`   ✓ Persisted and retrieved ${retrieved.length} evidence records from SQLite`);
  } finally {
    // Cleanup
    await db.delete(evidence).where(eq(evidence.studentId, studentId));
    await db.delete(tasks).where(inArray(tasks.id, ["task-pe", "task-ps", "task-in", "task-se"]));
    await db.delete(profiles).where(eq(profiles.id, studentId));
    console.log("   ✓ Cleaned up test records from database");
  }

  console.log("\n=== All Evidence Engine Verifications Passed Successfully! ===");
}

runEvidenceVerification().catch((err) => {
  console.error("Evidence verification failed:", err);
  process.exit(1);
});
