import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import type {
  ProfileRole,
  MissionStatus,
  DevelopmentDimension,
  EventType,
  EventSource,
  EvidenceStrength,
} from "@education-growth/shared";

// ============================================================================
// 1. PROFILES
// Represents students and teachers with their assigned role.
// ============================================================================
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").$type<ProfileRole>().notNull(),
  classId: text("class_id"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// 2. TASKS
// Represents standard academic curriculum work created by teachers/profiles.
// ============================================================================
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  createdBy: text("created_by").references(() => profiles.id),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// 3. MISSIONS
// Represents a development-oriented mission attached to academic work.
// ============================================================================
export const missions = sqliteTable("missions", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  studentId: text("student_id").notNull().references(() => profiles.id),
  instruction: text("instruction").notNull(),
  dimensions: text("dimensions", { mode: "json" }).$type<DevelopmentDimension[]>().notNull(),
  status: text("status").$type<MissionStatus>().notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

// ============================================================================
// 4. EVENTS
// The core observable actions log (never subjective claims).
// ============================================================================
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => profiles.id),
    taskId: text("task_id").references(() => tasks.id),
    type: text("type").$type<EventType>().notNull(),
    source: text("source").$type<EventSource>().notNull(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("events_student_id_idx").on(table.studentId),
    index("events_task_id_idx").on(table.taskId),
    index("events_created_at_idx").on(table.createdAt),
  ]
);

// ============================================================================
// 5. EVIDENCE
// Traceable, explainable evidence derived from observable events.
// ============================================================================
export const evidence = sqliteTable(
  "evidence",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id").notNull().references(() => profiles.id),
    taskId: text("task_id").references(() => tasks.id),
    dimension: text("dimension").$type<DevelopmentDimension>().notNull(),
    ruleId: text("rule_id").notNull(),
    summary: text("summary").notNull(),
    supportingEventIds: text("supporting_event_ids", { mode: "json" }).$type<string[]>().notNull(),
    strength: text("strength").$type<EvidenceStrength>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("evidence_student_id_idx").on(table.studentId),
    index("evidence_dimension_idx").on(table.dimension),
  ]
);
