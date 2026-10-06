import assert from "node:assert/strict";
import { seedDatabase, seedProfiles, seedTasks, seedMissions, seedEvents } from "./seed";
import { db } from "../db/client";
import { profiles, tasks, missions, events, evidence } from "../db/schema";
import { generateDevelopmentSignals } from "../engine/signals";
import { inArray } from "drizzle-orm";

async function runSeedVerification() {
  console.log("=== Starting Task 1E Seed Data Verification ===");

  // 1. Initial Seed Execution
  console.log("\n1. Executing initial database seeding...");
  const initialCounts = await seedDatabase();

  assert.equal(initialCounts.profilesCount, seedProfiles.length, `Expected ${seedProfiles.length} profiles seeded`);
  assert.equal(initialCounts.tasksCount, seedTasks.length, `Expected ${seedTasks.length} tasks seeded`);
  assert.equal(initialCounts.missionsCount, seedMissions.length, `Expected ${seedMissions.length} missions seeded`);
  assert.equal(initialCounts.eventsCount, seedEvents.length, `Expected ${seedEvents.length} events seeded`);
  assert.ok(initialCounts.evidenceCount > 0, "Expected derived evidence records generated");
  console.log("   ✓ Initial seed execution completed successfully");

  // 2. Direct Database Persistence Verification
  console.log("\n2. Verifying database records directly from SQLite...");
  const dbProfiles = await db.select().from(profiles).where(
    inArray(profiles.id, seedProfiles.map((p) => p.id))
  );
  assert.equal(dbProfiles.length, seedProfiles.length, "Database must contain all seeded profiles");

  const teacher = dbProfiles.find((p) => p.role === "teacher");
  assert.ok(teacher, "Teacher profile must exist");
  assert.equal(teacher.name, "Dr. Sarah Adams");

  const students = dbProfiles.filter((p) => p.role === "student");
  assert.equal(students.length, 4, "Must contain exactly 4 student profiles");

  const dbTasks = await db.select().from(tasks).where(
    inArray(tasks.id, seedTasks.map((t) => t.id))
  );
  assert.equal(dbTasks.length, seedTasks.length, "Database must contain all seeded tasks");

  const dbMissions = await db.select().from(missions).where(
    inArray(missions.id, seedMissions.map((m) => m.id))
  );
  assert.equal(dbMissions.length, seedMissions.length, "Database must contain all seeded missions");

  const dbEvents = await db.select().from(events).where(
    inArray(events.id, seedEvents.map((e) => e.id))
  );
  assert.equal(dbEvents.length, seedEvents.length, `Database must contain all ${seedEvents.length} seeded events`);

  const dbEvidence = await db.select().from(evidence).where(
    inArray(evidence.studentId, students.map((s) => s.id))
  );
  assert.equal(
    dbEvidence.length,
    initialCounts.evidenceCount,
    "Database must contain all derived evidence records"
  );
  console.log(`   ✓ Verified directly in SQLite:`);
  console.log(`     - ${dbProfiles.length} Profiles (1 teacher, 4 students)`);
  console.log(`     - ${dbTasks.length} Tasks`);
  console.log(`     - ${dbMissions.length} Missions`);
  console.log(`     - ${dbEvents.length} Events`);
  console.log(`     - ${dbEvidence.length} Evidence Records`);

  // 3. Foreign Key & Metadata Integrity Verification
  console.log("\n3. Verifying foreign key relationships and metadata retention...");
  for (const ev of dbEvents) {
    assert.ok(ev.studentId, "Event must have studentId");
    assert.ok(typeof ev.metadata === "object" && ev.metadata !== null, "Metadata must be preserved as object");
  }

  for (const evRecord of dbEvidence) {
    assert.ok(evRecord.supportingEventIds.length > 0, "Evidence record must have supportingEventIds");
    for (const eventId of evRecord.supportingEventIds) {
      const existsInDb = dbEvents.some((e) => e.id === eventId);
      assert.ok(existsInDb, `Supporting event ID '${eventId}' must exist in events table`);
    }
  }
  console.log("   ✓ Foreign keys, supporting event IDs, and metadata validated");

  // 4. Idempotency Verification (Repeat Seeding)
  console.log("\n4. Testing Idempotency: Re-running seedDatabase() on existing data...");
  const secondCounts = await seedDatabase();
  assert.deepEqual(
    secondCounts,
    initialCounts,
    "Second seed run must return exact same counts as first run"
  );

  const recheckProfiles = await db.select().from(profiles).where(
    inArray(profiles.id, seedProfiles.map((p) => p.id))
  );
  const recheckTasks = await db.select().from(tasks).where(
    inArray(tasks.id, seedTasks.map((t) => t.id))
  );
  const recheckMissions = await db.select().from(missions).where(
    inArray(missions.id, seedMissions.map((m) => m.id))
  );
  const recheckEvents = await db.select().from(events).where(
    inArray(events.id, seedEvents.map((e) => e.id))
  );
  const recheckEvidence = await db.select().from(evidence).where(
    inArray(evidence.studentId, students.map((s) => s.id))
  );

  assert.equal(recheckProfiles.length, seedProfiles.length, "Profiles must not be duplicated");
  assert.equal(recheckTasks.length, seedTasks.length, "Tasks must not be duplicated");
  assert.equal(recheckMissions.length, seedMissions.length, "Missions must not be duplicated");
  assert.equal(recheckEvents.length, seedEvents.length, "Events must not be duplicated");
  assert.equal(recheckEvidence.length, initialCounts.evidenceCount, "Evidence must not be duplicated");
  console.log("   ✓ Idempotency confirmed: zero duplicate records created on repeated seeding");

  // 5. Verification of Student Development Signals on Seed Data
  console.log("\n5. Verifying deterministic development signals derived from seeded student journeys...");

  // Student 1: Maya Chen (SR-01 and SE-01)
  const mayaEvents = dbEvents.filter((e) => e.studentId === "student-maya");
  const mayaSignals = generateDevelopmentSignals(mayaEvents);
  const mayaSR = mayaSignals.find((s) => s.dimension === "self_reliance");
  assert.ok(mayaSR);
  assert.equal(mayaSR.state, "positive");
  assert.equal(mayaSR.ruleId, "SR-01");
  assert.equal(mayaSR.evidenceStrength, "strengthening");

  const mayaSE = mayaSignals.find((s) => s.dimension === "sustained_engagement");
  assert.ok(mayaSE);
  assert.equal(mayaSE.state, "positive");
  assert.equal(mayaSE.ruleId, "SE-01");
  console.log("   ✓ Maya Chen: Positive Self-Reliance (SR-01, strengthening) & Sustained Engagement (SE-01)");

  // Student 2: Leo Rodriguez (PE-01 and PS-01)
  const leoEvents = dbEvents.filter((e) => e.studentId === "student-leo");
  const leoSignals = generateDevelopmentSignals(leoEvents);
  const leoPE = leoSignals.find((s) => s.dimension === "perseverance");
  assert.ok(leoPE);
  assert.equal(leoPE.state, "positive");
  assert.equal(leoPE.ruleId, "PE-01");

  const leoPS = leoSignals.find((s) => s.dimension === "problem_solving");
  assert.ok(leoPS);
  assert.equal(leoPS.state, "positive");
  assert.equal(leoPS.ruleId, "PS-01");
  console.log("   ✓ Leo Rodriguez: Positive Perseverance (PE-01) & Problem Solving (PS-01)");

  // Student 3: Aisha Patel (IN-01)
  const aishaEvents = dbEvents.filter((e) => e.studentId === "student-aisha");
  const aishaSignals = generateDevelopmentSignals(aishaEvents);
  const aishaIN = aishaSignals.find((s) => s.dimension === "initiative");
  assert.ok(aishaIN);
  assert.equal(aishaIN.state, "positive");
  assert.equal(aishaIN.ruleId, "IN-01");
  console.log("   ✓ Aisha Patel: Positive Initiative (IN-01)");

  // Student 4: Jordan Taylor (Insufficient Data)
  const jordanEvents = dbEvents.filter((e) => e.studentId === "student-jordan");
  const jordanSignals = generateDevelopmentSignals(jordanEvents);
  for (const sig of jordanSignals) {
    assert.equal(
      sig.state,
      "insufficient_data",
      `Jordan must have insufficient_data on '${sig.dimension}', got '${sig.state}'`
    );
  }
  console.log("   ✓ Jordan Taylor: Clean 'insufficient_data' across all 5 dimensions (no negative judgment)");

  console.log("\n=== All Task 1E Seed Data Verifications Passed Successfully! ===");
}

runSeedVerification().catch((err) => {
  console.error("Seed verification failed:", err);
  process.exit(1);
});
