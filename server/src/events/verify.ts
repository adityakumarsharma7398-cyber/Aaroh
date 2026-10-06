import assert from "node:assert/strict";
import { db } from "../db/client";
import { profiles, tasks, events } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  recordEvent,
  getStudentEvents,
  getTaskEvents,
  getStudentTaskEvents,
} from "./logger";
import type { EventType, EventSource } from "@education-growth/shared";

async function runVerification() {
  console.log("=== Starting Event Logger Verification ===");

  const testStudentId = `test-student-${Date.now()}`;
  const testTeacherId = `test-teacher-${Date.now()}`;
  const testTaskId = `test-task-${Date.now()}`;

  // 1. Setup prerequisite profile & task records to satisfy foreign key constraints
  console.log("1. Setting up prerequisite test profile and task records...");
  await db.insert(profiles).values([
    {
      id: testTeacherId,
      name: "Test Teacher",
      email: "teacher@test.local",
      role: "teacher",
      createdAt: new Date().toISOString(),
    },
    {
      id: testStudentId,
      name: "Test Student",
      email: "student@test.local",
      role: "student",
      createdAt: new Date().toISOString(),
    },
  ]);

  await db.insert(tasks).values({
    id: testTaskId,
    title: "Algebra Foundation Problem Set",
    subject: "Mathematics",
    description: "Solve linear equations with one variable",
    createdBy: testTeacherId,
    createdAt: new Date().toISOString(),
  });

  const createdEventIds: string[] = [];

  try {
    // 2. Record an 'attempt' event
    console.log("2. Recording 'attempt' event...");
    const attemptEvent = await recordEvent({
      studentId: testStudentId,
      taskId: testTaskId,
      type: "attempt",
      source: "app",
      metadata: { attemptNumber: 1, result: "failed", timeSpentSec: 45 },
      createdAt: new Date(Date.now() - 5000).toISOString(),
    });
    createdEventIds.push(attemptEvent.id);
    assert.equal(attemptEvent.type, "attempt");
    assert.equal(attemptEvent.studentId, testStudentId);
    assert.equal(attemptEvent.taskId, testTaskId);
    assert.deepEqual(attemptEvent.metadata, {
      attemptNumber: 1,
      result: "failed",
      timeSpentSec: 45,
    });
    console.log("   ✓ 'attempt' event recorded and metadata preserved");

    // 3. Record a 'hint_requested' event
    console.log("3. Recording 'hint_requested' event...");
    const hintReqEvent = await recordEvent({
      studentId: testStudentId,
      taskId: testTaskId,
      type: "hint_requested",
      source: "student",
      metadata: { requestedLevel: 1 },
      createdAt: new Date(Date.now() - 4000).toISOString(),
    });
    createdEventIds.push(hintReqEvent.id);
    assert.equal(hintReqEvent.type, "hint_requested");
    assert.equal(hintReqEvent.source, "student");
    assert.equal(hintReqEvent.metadata.requestedLevel, 1);
    console.log("   ✓ 'hint_requested' event recorded and metadata preserved");

    // 4. Record a 'hint_level_granted' event
    console.log("4. Recording 'hint_level_granted' event...");
    const hintGrantedEvent = await recordEvent({
      studentId: testStudentId,
      taskId: testTaskId,
      type: "hint_level_granted",
      source: "app",
      metadata: { level: 1, reason: "required_attempts_completed" },
      createdAt: new Date(Date.now() - 3000).toISOString(),
    });
    createdEventIds.push(hintGrantedEvent.id);
    assert.equal(hintGrantedEvent.type, "hint_level_granted");
    assert.equal(hintGrantedEvent.metadata.level, 1);
    assert.equal(hintGrantedEvent.metadata.reason, "required_attempts_completed");
    console.log("   ✓ 'hint_level_granted' event recorded and metadata preserved");

    // 5. Record a 'completed' event
    console.log("5. Recording 'completed' event...");
    const completedEvent = await recordEvent({
      studentId: testStudentId,
      taskId: testTaskId,
      type: "completed",
      source: "app",
      metadata: { success: true, finalScore: 100 },
      createdAt: new Date(Date.now() - 1000).toISOString(),
    });
    createdEventIds.push(completedEvent.id);
    assert.equal(completedEvent.type, "completed");
    assert.equal(completedEvent.metadata.success, true);
    console.log("   ✓ 'completed' event recorded and metadata preserved");

    // 6. Query student events and verify chronological order
    console.log("6. Verifying getStudentEvents() returns chronological list...");
    const studentEvents = await getStudentEvents(testStudentId);
    assert.equal(studentEvents.length, 4);
    assert.equal(studentEvents[0].id, attemptEvent.id);
    assert.equal(studentEvents[1].id, hintReqEvent.id);
    assert.equal(studentEvents[2].id, hintGrantedEvent.id);
    assert.equal(studentEvents[3].id, completedEvent.id);

    for (let i = 0; i < studentEvents.length - 1; i++) {
      const current = new Date(studentEvents[i].createdAt).getTime();
      const next = new Date(studentEvents[i + 1].createdAt).getTime();
      assert.ok(
        current <= next,
        `Events not in chronological order: ${studentEvents[i].createdAt} > ${studentEvents[i + 1].createdAt}`
      );
    }
    console.log("   ✓ Chronological ordering verified across student events");

    // 7. Query task events
    console.log("7. Verifying getTaskEvents()...");
    const taskEvents = await getTaskEvents(testTaskId);
    assert.equal(taskEvents.length, 4);
    assert.equal(taskEvents[0].taskId, testTaskId);
    console.log("   ✓ Task events retrieved successfully");

    // 8. Query student-task events
    console.log("8. Verifying getStudentTaskEvents()...");
    const studentTaskEvents = await getStudentTaskEvents(testStudentId, testTaskId);
    assert.equal(studentTaskEvents.length, 4);
    console.log("   ✓ Student-task scoped events retrieved successfully");

    // 9. Verify validation safeguards against subjective or invalid inputs
    console.log("9. Verifying rejection of subjective and invalid event types...");
    await assert.rejects(
      async () => {
        // Subjective judgment attempt (should fail runtime validation)
        await recordEvent({
          studentId: testStudentId,
          taskId: testTaskId,
          type: "student_is_confident" as unknown as EventType,
          source: "teacher",
          metadata: {},
        });
      },
      {
        message: /Invalid event type/,
      }
    );

    await assert.rejects(
      async () => {
        // Invalid source attempt
        await recordEvent({
          studentId: testStudentId,
          taskId: testTaskId,
          type: "attempt",
          source: "external_ai" as unknown as EventSource,
          metadata: {},
        });
      },
      {
        message: /Invalid event source/,
      }
    );

    await assert.rejects(
      async () => {
        // Missing studentId attempt
        await recordEvent({
          studentId: "",
          type: "attempt",
          source: "app",
        });
      },
      {
        message: /Invalid studentId/,
      }
    );
    console.log("   ✓ Subjective judgements and invalid parameters cleanly rejected");

    console.log("\n=== All Event Logger Verifications Passed Successfully! ===");
  } finally {
    // Cleanup test data
    console.log("Cleaning up test records...");
    if (createdEventIds.length > 0) {
      await db.delete(events).where(inArray(events.id, createdEventIds));
    }
    await db.delete(tasks).where(eq(tasks.id, testTaskId));
    await db.delete(profiles).where(inArray(profiles.id, [testStudentId, testTeacherId]));
    console.log("Cleaned up test data.");
  }
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
