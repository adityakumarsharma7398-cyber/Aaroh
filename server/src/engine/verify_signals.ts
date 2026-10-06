import assert from "node:assert/strict";
import {
  generateDevelopmentSignals,
  evaluateSelfRelianceSignal,
  evaluatePerseveranceSignal,
  evaluateProblemSolvingSignal,
  evaluateInitiativeSignal,
  evaluateSustainedEngagementSignal,
} from "./signals";
import type { ObservableEvent, ObservableDevelopmentSignal } from "@education-growth/shared";

async function runSignalVerification() {
  console.log("=== Starting Deterministic Development Signal Engine Verification ===");

  const studentId = "student-signals-test";
  const now = 1700000000000; // Fixed timestamp for deterministic testing

  // Helper to construct test events
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
  // TEST 1: Positive Self-Reliance Case (decreasing hints 4 -> 3 -> 2 across 3 tasks)
  // -------------------------------------------------------------------------
  console.log("\n1. Testing positive Self-Reliance case (decreasing hints across 3 tasks)...");
  const srPositiveEvents: ObservableEvent[] = [
    makeEvent("ev-t1-h", "hint_level_granted", "app", "task-1", { level: 4 }, 10),
    makeEvent("ev-t1-c", "completed", "app", "task-1", { success: true }, 20),
    makeEvent("ev-t2-h", "hint_level_granted", "app", "task-2", { level: 3 }, 30),
    makeEvent("ev-t2-c", "completed", "app", "task-2", { success: true }, 40),
    makeEvent("ev-t3-h", "hint_level_granted", "app", "task-3", { level: 2 }, 50),
    makeEvent("ev-t3-c", "completed", "app", "task-3", { success: true }, 60),
  ];
  const srSig = evaluateSelfRelianceSignal(srPositiveEvents);
  assert.equal(srSig.dimension, "self_reliance");
  assert.equal(srSig.state, "positive");
  assert.equal(srSig.ruleId, "SR-01");
  assert.equal(
    srSig.summary,
    "Positive development signal: required assistance decreased across comparable tasks."
  );
  assert.equal(srSig.supportingEventIds.length, 6);
  assert.equal(srSig.isCharacterVerdict, false);
  console.log("   ✓ Positive self-reliance signal generated with 'positive' state");
  console.log(`   Summary: "${srSig.summary}"`);
  console.log(`   Explanation: "${srSig.ruleExplanation}"`);

  // -------------------------------------------------------------------------
  // TEST 2: Insufficient-Data Self-Reliance Case (only 1 task)
  // -------------------------------------------------------------------------
  console.log("\n2. Testing insufficient-data Self-Reliance case (only 1 task)...");
  const srSparseEvents: ObservableEvent[] = [
    makeEvent("ev-s1-h", "hint_level_granted", "app", "task-1", { level: 4 }, 10),
    makeEvent("ev-s1-c", "completed", "app", "task-1", { success: true }, 20),
  ];
  const srSparseSig = evaluateSelfRelianceSignal(srSparseEvents);
  assert.equal(srSparseSig.dimension, "self_reliance");
  assert.equal(srSparseSig.state, "insufficient_data");
  assert.equal(srSparseSig.ruleId, "SR-01");
  assert.equal(srSparseSig.evidenceStrength, "insufficient");
  assert.equal(srSparseSig.supportingEventIds.length, 0);
  assert.equal(srSparseSig.isCharacterVerdict, false);
  console.log("   ✓ Insufficient-data self-reliance produced 'insufficient_data' state without negative verdict");

  // -------------------------------------------------------------------------
  // TEST 3: Perseverance after failure and retry
  // -------------------------------------------------------------------------
  console.log("\n3. Testing Perseverance after failure and retry...");
  const peEvents: ObservableEvent[] = [
    makeEvent("ev-pe-fail", "attempt", "app", "task-pe", { result: "failed" }, 10),
    makeEvent("ev-pe-retry", "retry", "app", "task-pe", { afterFailure: true }, 20),
    makeEvent("ev-pe-comp", "completed", "app", "task-pe", { success: true }, 30),
  ];
  const peSig = evaluatePerseveranceSignal(peEvents);
  assert.equal(peSig.dimension, "perseverance");
  assert.equal(peSig.state, "positive");
  assert.equal(peSig.ruleId, "PE-01");
  assert.equal(
    peSig.summary,
    "Positive development signal: student retried after an unsuccessful attempt."
  );
  assert.deepEqual(peSig.supportingEventIds, ["ev-pe-fail", "ev-pe-retry", "ev-pe-comp"]);
  assert.equal(peSig.isCharacterVerdict, false);
  console.log("   ✓ Perseverance signal generated from observable setback-and-retry sequence");
  console.log(`   Summary: "${peSig.summary}"`);

  // -------------------------------------------------------------------------
  // TEST 4: Problem-Solving through feedback/retry
  // -------------------------------------------------------------------------
  console.log("\n4. Testing Problem-Solving through feedback and retry...");
  const psEvents: ObservableEvent[] = [
    makeEvent("ev-ps-att", "attempt", "app", "task-ps", { attemptNumber: 1 }, 10),
    makeEvent("ev-ps-feed", "feedback_applied", "app", "task-ps", { suggestion: "simplify terms" }, 20),
    makeEvent("ev-ps-retry", "retry", "app", "task-ps", { revised: true }, 30),
    makeEvent("ev-ps-comp", "completed", "app", "task-ps", { success: true }, 40),
  ];
  const psSig = evaluateProblemSolvingSignal(psEvents);
  assert.equal(psSig.dimension, "problem_solving");
  assert.equal(psSig.state, "positive");
  assert.equal(psSig.ruleId, "PS-01");
  assert.equal(
    psSig.summary,
    "Positive development signal: student applied feedback and adjusted approach before completing the task."
  );
  assert.deepEqual(psSig.supportingEventIds, [
    "ev-ps-att",
    "ev-ps-feed",
    "ev-ps-retry",
    "ev-ps-comp",
  ]);
  assert.equal(psSig.isCharacterVerdict, false);
  console.log("   ✓ Problem-solving signal generated from feedback and revised attempt");
  console.log(`   Summary: "${psSig.summary}"`);

  // -------------------------------------------------------------------------
  // TEST 5: Initiative with valid evidence (teacher observation of extension)
  // -------------------------------------------------------------------------
  console.log("\n5. Testing Initiative with valid observable evidence...");
  const inEvents: ObservableEvent[] = [
    makeEvent("ev-in-obs", "teacher_observation", "teacher", "task-in", {
      category: "optional_extension_completed",
      note: "student completed an optional extension beyond the required task.",
    }),
  ];
  const inSig = evaluateInitiativeSignal(inEvents);
  assert.equal(inSig.dimension, "initiative");
  assert.equal(inSig.state, "positive");
  assert.equal(inSig.ruleId, "IN-01");
  assert.equal(
    inSig.summary,
    "Positive development signal: student completed an optional extension beyond required task."
  );
  assert.deepEqual(inSig.supportingEventIds, ["ev-in-obs"]);
  assert.equal(inSig.isCharacterVerdict, false);
  console.log("   ✓ Initiative signal generated from explicit observable extension");
  console.log(`   Summary: "${inSig.summary}"`);

  // -------------------------------------------------------------------------
  // TEST 6: Initiative with insufficient evidence
  // -------------------------------------------------------------------------
  console.log("\n6. Testing Initiative with insufficient evidence...");
  const noInEvents: ObservableEvent[] = [
    makeEvent("ev-in-normal", "completed", "app", "task-in", { speed: "fast", score: 98 }),
  ];
  const noInSig = evaluateInitiativeSignal(noInEvents);
  assert.equal(noInSig.dimension, "initiative");
  assert.equal(noInSig.state, "insufficient_data");
  assert.equal(noInSig.ruleId, "IN-01");
  assert.equal(noInSig.evidenceStrength, "insufficient");
  assert.equal(noInSig.supportingEventIds.length, 0);
  assert.equal(noInSig.isCharacterVerdict, false);
  console.log("   ✓ Initiative correctly returned 'insufficient_data' without inferring from speed/score");

  // -------------------------------------------------------------------------
  // TEST 7: Sustained Engagement with valid observable activity
  // -------------------------------------------------------------------------
  console.log("\n7. Testing Sustained Engagement with valid observable activity...");
  const seEvents: ObservableEvent[] = [
    makeEvent("ev-se-att1", "attempt", "app", "task-se", { attemptNumber: 1 }, 10),
    makeEvent("ev-se-feed", "feedback_applied", "app", "task-se", { tip: "check steps" }, 20),
    makeEvent("ev-se-retry", "retry", "app", "task-se", { attemptNumber: 2 }, 30),
    makeEvent("ev-se-ref", "reflection", "student", "task-se", { note: "understood error" }, 40),
  ];
  const seSig = evaluateSustainedEngagementSignal(seEvents);
  assert.equal(seSig.dimension, "sustained_engagement");
  assert.equal(seSig.state, "positive");
  assert.equal(seSig.ruleId, "SE-01");
  assert.equal(
    seSig.summary,
    "Sustained engagement signal based on observable task activity."
  );
  assert.equal(seSig.supportingEventIds.length, 4);
  assert.equal(seSig.isCharacterVerdict, false);
  console.log("   ✓ Sustained engagement signal generated based on observable multi-step activity");
  console.log(`   Summary: "${seSig.summary}"`);

  // -------------------------------------------------------------------------
  // TEST 8: Sustained Engagement with insufficient evidence
  // -------------------------------------------------------------------------
  console.log("\n8. Testing Sustained Engagement with insufficient evidence...");
  const sparseSeEvents: ObservableEvent[] = [
    makeEvent("ev-sparse", "attempt", "app", "task-se-sparse", { attemptNumber: 1 }),
  ];
  const sparseSeSig = evaluateSustainedEngagementSignal(sparseSeEvents);
  assert.equal(sparseSeSig.dimension, "sustained_engagement");
  assert.equal(sparseSeSig.state, "insufficient_data");
  assert.equal(sparseSeSig.ruleId, "SE-01");
  assert.equal(sparseSeSig.evidenceStrength, "insufficient");
  assert.equal(sparseSeSig.supportingEventIds.length, 0);
  assert.equal(sparseSeSig.isCharacterVerdict, false);
  console.log("   ✓ Sustained engagement correctly returned 'insufficient_data' on sparse session");

  // -------------------------------------------------------------------------
  // TEST 9: Supporting event IDs are preserved across all signals
  // -------------------------------------------------------------------------
  console.log("\n9. Testing supporting event IDs preservation in full signal suite...");
  const allEvents: ObservableEvent[] = [
    ...srPositiveEvents,
    ...peEvents,
    ...psEvents,
    ...inEvents,
    ...seEvents,
  ];
  const signals = generateDevelopmentSignals(allEvents);
  assert.equal(signals.length, 5, "Expected exactly 5 MVP dimensions evaluated");

  for (const sig of signals) {
    assert.ok(sig.id.startsWith("sig-"), "Signal ID must be prefixed with sig-");
    assert.ok(
      ["positive", "neutral", "insufficient_data"].includes(sig.state),
      `Invalid signal state '${sig.state}'`
    );
    if (sig.state === "positive") {
      assert.ok(
        sig.supportingEventIds.length > 0,
        `Positive signal '${sig.dimension}' must have supportingEventIds`
      );
      for (const id of sig.supportingEventIds) {
        const found = allEvents.some((e) => e.id === id);
        assert.ok(found, `Supporting event ID '${id}' must exist in input event stream`);
      }
    }
  }
  console.log("   ✓ All 5 signals properly preserve traceable event IDs");

  // -------------------------------------------------------------------------
  // TEST 10: Same input produces identical signal output (Pure Determinism)
  // -------------------------------------------------------------------------
  console.log("\n10. Testing pure determinism (same input -> identical signal output)...");
  const runA = generateDevelopmentSignals(allEvents);
  const runB = generateDevelopmentSignals(allEvents);
  assert.deepEqual(runA, runB, "Multiple executions with identical inputs must return identical signals");
  console.log("   ✓ Pure determinism verified: 100% identical signal objects across repeated runs");

  // -------------------------------------------------------------------------
  // TEST 11: No character/personality claims are generated
  // -------------------------------------------------------------------------
  console.log("\n11. Testing strict avoidance of character/personality verdicts...");
  const forbiddenTerms = [
    "good character",
    "bad character",
    "personality",
    "smart",
    "lazy",
    "intelligent",
    "genius",
    "gifted",
    "high character",
    "character score",
    "personality verdict",
    "concentration score",
  ];

  for (const sig of signals) {
    assert.equal(
      sig.isCharacterVerdict,
      false,
      `Signal '${sig.dimension}' must explicitly set isCharacterVerdict: false`
    );

    const fullText = `${sig.summary} ${sig.ruleExplanation}`.toLowerCase();
    for (const term of forbiddenTerms) {
      assert.ok(
        !fullText.includes(term),
        `Signal '${sig.dimension}' contained forbidden character judgment term: '${term}'`
      );
    }
  }
  console.log("   ✓ Verified: zero personality scores, zero psychological verdicts, isCharacterVerdict=false");

  console.log("\n=== All 11 Development Signal Engine Verifications Passed Successfully! ===");
}

runSignalVerification().catch((err) => {
  console.error("Signal verification failed:", err);
  process.exit(1);
});
