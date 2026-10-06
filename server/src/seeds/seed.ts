import path from "node:path";
import { db } from "../db/client";
import { profiles, tasks, missions, events, evidence } from "../db/schema";
import { generateEvidence, persistEvidence } from "../engine/evidence";
import { inArray } from "drizzle-orm";
import type {
  Profile,
  AcademicTask,
  Mission,
  ObservableEvent,
} from "@education-growth/shared";

// Deterministic Identifiers for Demo Seed Data
export const SEED_PROFILE_IDS = [
  "prof-teacher-1",
  "student-maya",
  "student-leo",
  "student-aisha",
  "student-jordan",
] as const;

export const SEED_TASK_IDS = [
  "task-math-101",
  "task-math-102",
  "task-math-103",
  "task-math-104",
] as const;

export const SEED_MISSION_IDS = [
  "mission-maya-1",
  "mission-leo-1",
  "mission-aisha-1",
  "mission-jordan-1",
] as const;

// 1. Profiles: 1 Teacher and 4 Students
export const seedProfiles: Profile[] = [
  {
    id: "prof-teacher-1",
    name: "Dr. Sarah Adams",
    email: "sarah.adams@academy.edu",
    role: "teacher",
    classId: "algebra-101",
    createdAt: "2026-10-01T08:00:00.000Z",
  },
  {
    id: "student-maya",
    name: "Maya Chen",
    email: "maya.chen@student.local",
    role: "student",
    classId: "algebra-101",
    createdAt: "2026-10-01T08:30:00.000Z",
  },
  {
    id: "student-leo",
    name: "Leo Rodriguez",
    email: "leo.rodriguez@student.local",
    role: "student",
    classId: "algebra-101",
    createdAt: "2026-10-01T08:35:00.000Z",
  },
  {
    id: "student-aisha",
    name: "Aisha Patel",
    email: "aisha.patel@student.local",
    role: "student",
    classId: "algebra-101",
    createdAt: "2026-10-01T08:40:00.000Z",
  },
  {
    id: "student-jordan",
    name: "Jordan Taylor",
    email: "jordan.taylor@student.local",
    role: "student",
    classId: "algebra-101",
    createdAt: "2026-10-01T08:45:00.000Z",
  },
];

// 2. Academic Tasks
export const seedTasks: AcademicTask[] = [
  {
    id: "task-math-101",
    title: "Linear Equations: Single Variable Fundamentals",
    subject: "Mathematics",
    description: "Solve first-order linear algebraic equations and simplify expressions.",
    createdBy: "prof-teacher-1",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "task-math-102",
    title: "Systems of Linear Equations",
    subject: "Mathematics",
    description: "Solve two-variable linear systems using substitution and elimination.",
    createdBy: "prof-teacher-1",
    createdAt: "2026-10-02T09:00:00.000Z",
  },
  {
    id: "task-math-103",
    title: "Quadratic Factorization & Roots",
    subject: "Mathematics",
    description: "Factor second-order polynomials and calculate real roots.",
    createdBy: "prof-teacher-1",
    createdAt: "2026-10-03T09:00:00.000Z",
  },
  {
    id: "task-math-104",
    title: "Applied Mathematical Modeling Challenge",
    subject: "Mathematics",
    description: "Formulate real-world rate and distance scenarios into algebraic models.",
    createdBy: "prof-teacher-1",
    createdAt: "2026-10-04T09:00:00.000Z",
  },
];

// 3. Missions
export const seedMissions: Mission[] = [
  {
    id: "mission-maya-1",
    taskId: "task-math-101",
    studentId: "student-maya",
    instruction: "Attempt each problem independently before requesting tiered assistance hints.",
    dimensions: ["self_reliance"],
    status: "completed",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "mission-leo-1",
    taskId: "task-math-102",
    studentId: "student-leo",
    instruction: "When encountering an error, inspect feedback and retry before requesting solution.",
    dimensions: ["perseverance", "problem_solving"],
    status: "completed",
    createdAt: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "mission-aisha-1",
    taskId: "task-math-103",
    studentId: "student-aisha",
    instruction: "Complete the elective polynomial challenge problem after finishing required core exercises.",
    dimensions: ["initiative"],
    status: "completed",
    createdAt: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "mission-jordan-1",
    taskId: "task-math-101",
    studentId: "student-jordan",
    instruction: "Complete the baseline introductory diagnostic exercises.",
    dimensions: ["self_reliance"],
    status: "active",
    createdAt: "2026-10-04T10:00:00.000Z",
  },
];

// 4. Observable Events (Realistic Student Journeys)
export const seedEvents: ObservableEvent[] = [
  // -------------------------------------------------------------------------
  // MAYA CHEN: Demonstrates Self-Reliance (SR-01) and Sustained Engagement (SE-01)
  // Across 3 tasks, hints decrease: Task 1 (Hint 4) -> Task 2 (Hint 3) -> Task 3 (Hint 2)
  // -------------------------------------------------------------------------
  // Task 1: Hint level 4
  {
    id: "ev-maya-01",
    studentId: "student-maya",
    taskId: "task-math-101",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, step: "equation_setup" },
    createdAt: "2026-10-01T10:05:00.000Z",
  },
  {
    id: "ev-maya-02",
    studentId: "student-maya",
    taskId: "task-math-101",
    type: "hint_requested",
    source: "student",
    metadata: { requestedLevel: 4 },
    createdAt: "2026-10-01T10:08:00.000Z",
  },
  {
    id: "ev-maya-03",
    studentId: "student-maya",
    taskId: "task-math-101",
    type: "hint_level_granted",
    source: "app",
    metadata: { level: 4, reason: "scaffolding_requested" },
    createdAt: "2026-10-01T10:08:05.000Z",
  },
  {
    id: "ev-maya-04",
    studentId: "student-maya",
    taskId: "task-math-101",
    type: "completed",
    source: "app",
    metadata: { success: true, finalScore: 90 },
    createdAt: "2026-10-01T10:20:00.000Z",
  },
  // Task 2: Hint level 3
  {
    id: "ev-maya-05",
    studentId: "student-maya",
    taskId: "task-math-102",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, step: "substitution" },
    createdAt: "2026-10-02T10:05:00.000Z",
  },
  {
    id: "ev-maya-06",
    studentId: "student-maya",
    taskId: "task-math-102",
    type: "hint_requested",
    source: "student",
    metadata: { requestedLevel: 3 },
    createdAt: "2026-10-02T10:09:00.000Z",
  },
  {
    id: "ev-maya-07",
    studentId: "student-maya",
    taskId: "task-math-102",
    type: "hint_level_granted",
    source: "app",
    metadata: { level: 3, reason: "intermediate_guidance" },
    createdAt: "2026-10-02T10:09:05.000Z",
  },
  {
    id: "ev-maya-08",
    studentId: "student-maya",
    taskId: "task-math-102",
    type: "completed",
    source: "app",
    metadata: { success: true, finalScore: 92 },
    createdAt: "2026-10-02T10:25:00.000Z",
  },
  // Task 3: Hint level 2 + multi-action engagement (attempt, feedback, retry, reflection, completed)
  {
    id: "ev-maya-09",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, step: "factorization" },
    createdAt: "2026-10-03T10:05:00.000Z",
  },
  {
    id: "ev-maya-10",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "hint_requested",
    source: "student",
    metadata: { requestedLevel: 2 },
    createdAt: "2026-10-03T10:08:00.000Z",
  },
  {
    id: "ev-maya-11",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "hint_level_granted",
    source: "app",
    metadata: { level: 2, reason: "formula_clarification" },
    createdAt: "2026-10-03T10:08:05.000Z",
  },
  {
    id: "ev-maya-12",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "feedback_applied",
    source: "app",
    metadata: { feedbackType: "grouping_rule_applied" },
    createdAt: "2026-10-03T10:12:00.000Z",
  },
  {
    id: "ev-maya-13",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "retry",
    source: "app",
    metadata: { attemptNumber: 2, strategy: "grouping_terms" },
    createdAt: "2026-10-03T10:16:00.000Z",
  },
  {
    id: "ev-maya-14",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "reflection",
    source: "student",
    metadata: { note: "Checked factorization roots by expanding terms back." },
    createdAt: "2026-10-03T10:20:00.000Z",
  },
  {
    id: "ev-maya-15",
    studentId: "student-maya",
    taskId: "task-math-103",
    type: "completed",
    source: "app",
    metadata: { success: true, finalScore: 96 },
    createdAt: "2026-10-03T10:22:00.000Z",
  },

  // -------------------------------------------------------------------------
  // LEO RODRIGUEZ: Demonstrates Perseverance (PE-01) & Problem Solving (PS-01)
  // Failed attempt -> applied feedback -> retry -> successful completion
  // -------------------------------------------------------------------------
  {
    id: "ev-leo-01",
    studentId: "student-leo",
    taskId: "task-math-102",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, result: "failed", error: "sign_error_in_elimination" },
    createdAt: "2026-10-02T11:05:00.000Z",
  },
  {
    id: "ev-leo-02",
    studentId: "student-leo",
    taskId: "task-math-102",
    type: "feedback_applied",
    source: "app",
    metadata: { feedbackType: "sign_error_review", note: "Reviewed distributive property across minus sign." },
    createdAt: "2026-10-02T11:10:00.000Z",
  },
  {
    id: "ev-leo-03",
    studentId: "student-leo",
    taskId: "task-math-102",
    type: "retry",
    source: "app",
    metadata: { afterFailure: true, revisedApproach: true },
    createdAt: "2026-10-02T11:15:00.000Z",
  },
  {
    id: "ev-leo-04",
    studentId: "student-leo",
    taskId: "task-math-102",
    type: "completed",
    source: "app",
    metadata: { success: true, finalScore: 100 },
    createdAt: "2026-10-02T11:25:00.000Z",
  },

  // -------------------------------------------------------------------------
  // AISHA PATEL: Demonstrates Initiative (IN-01)
  // Standard task completed + explicit teacher observation of optional extension
  // -------------------------------------------------------------------------
  {
    id: "ev-aisha-01",
    studentId: "student-aisha",
    taskId: "task-math-103",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, result: "passed" },
    createdAt: "2026-10-03T14:05:00.000Z",
  },
  {
    id: "ev-aisha-02",
    studentId: "student-aisha",
    taskId: "task-math-103",
    type: "completed",
    source: "app",
    metadata: { success: true, finalScore: 98 },
    createdAt: "2026-10-03T14:18:00.000Z",
  },
  {
    id: "ev-aisha-03",
    studentId: "student-aisha",
    taskId: "task-math-103",
    type: "teacher_observation",
    source: "teacher",
    metadata: {
      category: "optional_extension_completed",
      note: "Student independently requested and completed elective 3-variable polynomial extension beyond the assignment.",
    },
    createdAt: "2026-10-03T14:30:00.000Z",
  },

  // -------------------------------------------------------------------------
  // JORDAN TAYLOR: Demonstrates Insufficient Data (insufficient_data)
  // Only 1 initial attempt recorded; demonstrates system avoids premature verdicts
  // -------------------------------------------------------------------------
  {
    id: "ev-jordan-01",
    studentId: "student-jordan",
    taskId: "task-math-101",
    type: "attempt",
    source: "app",
    metadata: { attemptNumber: 1, inProgress: true },
    createdAt: "2026-10-04T09:10:00.000Z",
  },
];

/**
 * Idempotently seeds the SQLite database with rich demo data:
 * - Profiles (1 teacher, 4 students)
 * - Academic tasks (4 curriculum tasks)
 * - Missions (4 development-linked learning objectives)
 * - Observable events (23 realistic student events)
 * - Pre-computed deterministic evidence records derived by the evidence engine
 */
export async function seedDatabase(): Promise<{
  profilesCount: number;
  tasksCount: number;
  missionsCount: number;
  eventsCount: number;
  evidenceCount: number;
}> {
  console.log("[Seed] Starting idempotent database seeding...");

  // 1. Clean existing seed records in reverse foreign-key order
  await db.delete(evidence).where(inArray(evidence.studentId, [...SEED_PROFILE_IDS]));
  await db.delete(events).where(inArray(events.studentId, [...SEED_PROFILE_IDS]));
  await db.delete(missions).where(inArray(missions.studentId, [...SEED_PROFILE_IDS]));
  await db.delete(tasks).where(inArray(tasks.id, [...SEED_TASK_IDS]));
  await db.delete(profiles).where(inArray(profiles.id, [...SEED_PROFILE_IDS]));

  // 2. Insert Profiles
  await db.insert(profiles).values(
    seedProfiles.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email ?? null,
      role: p.role,
      classId: p.classId ?? null,
      createdAt: p.createdAt,
    }))
  );

  // 3. Insert Tasks
  await db.insert(tasks).values(
    seedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      description: t.description,
      createdBy: t.createdBy ?? null,
      createdAt: t.createdAt,
    }))
  );

  // 4. Insert Missions
  await db.insert(missions).values(
    seedMissions.map((m) => ({
      id: m.id,
      taskId: m.taskId,
      studentId: m.studentId,
      instruction: m.instruction,
      dimensions: m.dimensions,
      status: m.status,
      createdAt: m.createdAt,
    }))
  );

  // 5. Insert Observable Events
  await db.insert(events).values(
    seedEvents.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      taskId: e.taskId ?? null,
      type: e.type,
      source: e.source,
      metadata: e.metadata,
      createdAt: e.createdAt,
    }))
  );

  // 6. Generate and Persist Deterministic Evidence Records
  const generatedEvidence = generateEvidence(seedEvents);
  await persistEvidence(generatedEvidence);

  console.log(`[Seed] Successfully seeded:`);
  console.log(`  - Profiles: ${seedProfiles.length}`);
  console.log(`  - Tasks: ${seedTasks.length}`);
  console.log(`  - Missions: ${seedMissions.length}`);
  console.log(`  - Events: ${seedEvents.length}`);
  console.log(`  - Derived Evidence Records: ${generatedEvidence.length}`);

  return {
    profilesCount: seedProfiles.length,
    tasksCount: seedTasks.length,
    missionsCount: seedMissions.length,
    eventsCount: seedEvents.length,
    evidenceCount: generatedEvidence.length,
  };
}

// Allow direct CLI execution: tsx src/seeds/seed.ts
const isMainScript =
  process.argv[1] &&
  (path.basename(process.argv[1]) === "seed.ts" ||
    path.basename(process.argv[1]) === "seed.js");

if (isMainScript) {
  seedDatabase()
    .then(() => {
      console.log("[Seed] Seeding completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed] Seeding failed:", err);
      process.exit(1);
    });
}
