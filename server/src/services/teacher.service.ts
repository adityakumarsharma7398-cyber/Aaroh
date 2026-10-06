import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/client";
import { profiles, tasks, events, evidence } from "../db/schema";
import { recordEvent, getStudentEvents } from "../events/logger";
import { generateEvidence, persistEvidence, getStudentEvidence } from "../engine/evidence";
import { generateDevelopmentSignals } from "../engine/signals";
import { ApiError } from "../middleware/error";
import type {
  Profile,
  AcademicTask,
  ObservableEvent,
  EvidenceRecord,
  ObservableDevelopmentSignal,
  DevelopmentDimension,
} from "@education-growth/shared";

export interface StudentSummary {
  id: string;
  name: string;
  email: string | null;
  classId: string | null;
  totalEventsCount: number;
  completedTasksCount: number;
  lastActiveAt: string | null;
}

export interface TeacherObservationRecord {
  id: string;
  studentId: string;
  teacherId?: string;
  text: string;
  dimension?: string | null;
  taskId?: string | null;
  createdAt: string;
}

export interface GroupSignalSummary {
  dimension: DevelopmentDimension;
  state: "positive" | "neutral" | "insufficient_data";
  summary: string;
  studentCount: number;
  positiveCount: number;
  insufficientCount: number;
  studentIds: string[];
  evidenceEventIds: string[];
}

export interface AttentionNote {
  studentId: string;
  studentName: string;
  kind: "insufficient-evidence" | "repeated-difficulty" | "inactive-work" | "observation-needed";
  detail: string;
}

export class TeacherService {
  /**
   * Lists students belonging to the teacher's class or all students if class is unassigned.
   */
  async listStudents(teacher: Profile): Promise<StudentSummary[]> {
    let studentProfiles: Profile[] = [];

    if (teacher.classId) {
      studentProfiles = (await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.role, "student"), eq(profiles.classId, teacher.classId)))) as Profile[];
    } else {
      studentProfiles = (await db
        .select()
        .from(profiles)
        .where(eq(profiles.role, "student"))) as Profile[];
    }

    const summaries: StudentSummary[] = [];

    for (const student of studentProfiles) {
      const studentEvents = await getStudentEvents(student.id);
      const completedEvents = studentEvents.filter((e) => e.type === "completed");
      const lastActive =
        studentEvents.length > 0 ? studentEvents[studentEvents.length - 1].createdAt : null;

      summaries.push({
        id: student.id,
        name: student.name,
        email: student.email ?? null,
        classId: student.classId ?? null,
        totalEventsCount: studentEvents.length,
        completedTasksCount: completedEvents.length,
        lastActiveAt: lastActive,
      });
    }

    return summaries;
  }

  /**
   * Retrieves an in-depth student overview for a teacher.
   */
  async getStudentOverview(
    teacher: Profile,
    studentId: string
  ): Promise<{
    profile: Profile;
    signals: ObservableDevelopmentSignal[];
    evidence: EvidenceRecord[];
    recentEvents: ObservableEvent[];
  }> {
    const matched = await db.select().from(profiles).where(eq(profiles.id, studentId)).limit(1);
    if (matched.length === 0) {
      throw new ApiError(404, "STUDENT_NOT_FOUND", `Student '${studentId}' was not found.`);
    }

    const student = matched[0] as Profile;
    if (teacher.classId && student.classId && teacher.classId !== student.classId) {
      throw new ApiError(403, "FORBIDDEN", "This student is not in your assigned class.");
    }

    const studentEvents = await getStudentEvents(studentId);
    const signals = generateDevelopmentSignals(studentEvents);
    const evidenceList = await getStudentEvidence(studentId);
    const recentEvents = [...studentEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      profile: student,
      signals,
      evidence: evidenceList,
      recentEvents,
    };
  }

  /**
   * Lists curriculum activities (tasks) created or available.
   */
  async listActivities(): Promise<AcademicTask[]> {
    const all = await db.select().from(tasks);
    return all as AcademicTask[];
  }

  /**
   * Creates a new curriculum activity/task.
   */
  async createActivity(
    teacherId: string,
    input: { title: string; subject: string; description: string }
  ): Promise<AcademicTask> {
    if (!input.title || !input.subject || !input.description) {
      throw new ApiError(400, "INVALID_INPUT", "Title, subject, and description are all required.");
    }

    const newTask: AcademicTask = {
      id: `task-${randomUUID().slice(0, 8)}`,
      title: input.title.trim(),
      subject: input.subject.trim(),
      description: input.description.trim(),
      createdBy: teacherId,
      createdAt: new Date().toISOString(),
    };

    await db.insert(tasks).values({
      id: newTask.id,
      title: newTask.title,
      subject: newTask.subject,
      description: newTask.description,
      createdBy: newTask.createdBy,
      createdAt: newTask.createdAt,
    });

    return newTask;
  }

  /**
   * Retrieves all recent events across students in the teacher's class.
   */
  async listClassEvents(teacher: Profile, limit = 50): Promise<ObservableEvent[]> {
    const students = await this.listStudents(teacher);
    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) return [];

    const classEvents = await db
      .select()
      .from(events)
      .where(inArray(events.studentId, studentIds));

    return classEvents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit) as ObservableEvent[];
  }

  /**
   * Returns development signals for all students in teacher's class.
   */
  async listClassSignals(
    teacher: Profile
  ): Promise<Array<{ studentId: string; studentName: string; signals: ObservableDevelopmentSignal[] }>> {
    const students = await this.listStudents(teacher);
    const results: Array<{
      studentId: string;
      studentName: string;
      signals: ObservableDevelopmentSignal[];
    }> = [];

    for (const s of students) {
      const studentEvents = await getStudentEvents(s.id);
      const signals = generateDevelopmentSignals(studentEvents);
      results.push({
        studentId: s.id,
        studentName: s.name,
        signals,
      });
    }

    return results;
  }

  /**
   * Aggregates class-level development signals per dimension without making personality claims.
   */
  async getGroupSignals(teacher: Profile): Promise<GroupSignalSummary[]> {
    const dimensions: DevelopmentDimension[] = [
      "self_reliance",
      "perseverance",
      "problem_solving",
      "initiative",
      "sustained_engagement",
    ];

    const classSignals = await this.listClassSignals(teacher);
    const totalStudents = classSignals.length;

    if (totalStudents < 2) {
      return dimensions.map((dim) => ({
        dimension: dim,
        state: "insufficient_data",
        summary: "More evidence across multiple students is needed before a group-level view can be formed.",
        studentCount: totalStudents,
        positiveCount: 0,
        insufficientCount: totalStudents,
        studentIds: classSignals.map((cs) => cs.studentId),
        evidenceEventIds: [],
      }));
    }

    return dimensions.map((dim) => {
      const positiveStudents: string[] = [];
      const evidenceIds: string[] = [];

      for (const cs of classSignals) {
        const sig = cs.signals.find((s) => s.dimension === dim);
        if (sig && sig.state === "positive") {
          positiveStudents.push(cs.studentId);
          evidenceIds.push(...sig.supportingEventIds);
        }
      }

      const positiveCount = positiveStudents.length;
      const insufficientCount = totalStudents - positiveCount;
      const state: "positive" | "neutral" | "insufficient_data" =
        positiveCount >= totalStudents / 2
          ? "positive"
          : positiveCount > 0
          ? "neutral"
          : "insufficient_data";

      const summary = `${positiveCount} of ${totalStudents} students currently exhibit observable positive evidence for ${dim.replace(/_/g, " ")}.`;

      return {
        dimension: dim,
        state,
        summary,
        studentCount: totalStudents,
        positiveCount,
        insufficientCount,
        studentIds: positiveStudents,
        evidenceEventIds: Array.from(new Set(evidenceIds)),
      };
    });
  }

  /**
   * Lists all evidence records across students in the teacher's class.
   */
  async listClassEvidence(teacher: Profile): Promise<EvidenceRecord[]> {
    const students = await this.listStudents(teacher);
    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) return [];

    const records = await db
      .select()
      .from(evidence)
      .where(inArray(evidence.studentId, studentIds));

    return records as EvidenceRecord[];
  }

  /**
   * Retrieves evidence records for a single student with authorization scoping.
   */
  async getStudentEvidence(teacher: Profile, studentId: string): Promise<EvidenceRecord[]> {
    const matched = await db.select().from(profiles).where(eq(profiles.id, studentId)).limit(1);
    if (matched.length === 0) {
      throw new ApiError(404, "STUDENT_NOT_FOUND", `Student '${studentId}' was not found.`);
    }

    const student = matched[0] as Profile;
    if (teacher.classId && student.classId && teacher.classId !== student.classId) {
      throw new ApiError(403, "FORBIDDEN", "Unauthorized: this student is not in your assigned class cohort.");
    }

    return getStudentEvidence(studentId);
  }

  /**
   * Records a qualitative teacher observation about a student.
   * Emits a 'teacher_observation' event and triggers the evidence pipeline.
   */
  async recordObservation(
    teacher: Profile,
    input: { studentId: string; text: string; dimension?: string; taskId?: string }
  ): Promise<TeacherObservationRecord> {
    if (!input.studentId || !input.text || input.text.trim().length === 0) {
      throw new ApiError(400, "INVALID_OBSERVATION", "Student ID and observation text are required.");
    }

    const studentRecord = await db.select().from(profiles).where(eq(profiles.id, input.studentId)).limit(1);
    if (studentRecord.length === 0) {
      throw new ApiError(404, "STUDENT_NOT_FOUND", `Student '${input.studentId}' not found.`);
    }

    const student = studentRecord[0] as Profile;
    if (teacher.classId && student.classId && teacher.classId !== student.classId) {
      throw new ApiError(403, "FORBIDDEN", "Unauthorized: this student is not in your assigned class cohort.");
    }

    const eventRecord = await recordEvent({
      studentId: input.studentId,
      taskId: input.taskId || null,
      type: "teacher_observation",
      source: "teacher",
      metadata: {
        text: input.text.trim(),
        dimension: input.dimension || null,
        teacherId: teacher.id,
      },
    });

    // Run deterministic evidence pipeline
    const updatedEvents = await getStudentEvents(input.studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      id: eventRecord.id,
      studentId: input.studentId,
      teacherId: teacher.id,
      text: input.text.trim(),
      dimension: input.dimension || null,
      taskId: input.taskId || null,
      createdAt: eventRecord.createdAt,
    };
  }

  /**
   * Lists qualitative teacher observations.
   */
  async listObservations(studentId?: string): Promise<TeacherObservationRecord[]> {
    let rawEvents: ObservableEvent[] = [];

    if (studentId) {
      const studentEvents = await getStudentEvents(studentId);
      rawEvents = studentEvents.filter((e) => e.type === "teacher_observation");
    } else {
      const allEvents = await db.select().from(events).where(eq(events.type, "teacher_observation"));
      rawEvents = allEvents as ObservableEvent[];
    }

    return rawEvents.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      teacherId: typeof e.metadata.teacherId === "string" ? e.metadata.teacherId : undefined,
      text: String(e.metadata.text || ""),
      dimension: typeof e.metadata.dimension === "string" ? e.metadata.dimension : null,
      taskId: e.taskId || null,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Derives contextual attention notes for the teacher.
   * Conversation starters based on observable evidence thresholds.
   */
  async deriveAttentionNotes(teacher: Profile): Promise<AttentionNote[]> {
    const students = await this.listStudents(teacher);
    const notes: AttentionNote[] = [];

    for (const student of students) {
      const studentEvents = await getStudentEvents(student.id);

      // 1. Insufficient evidence note
      if (studentEvents.length < 3) {
        notes.push({
          studentId: student.id,
          studentName: student.name,
          kind: "insufficient-evidence",
          detail: `Only ${studentEvents.length} recorded action(s) so far. More observable work is needed before meaningful development signals emerge.`,
        });
      }

      // 2. Repeated difficulty note (>= 3 high-level hints requested)
      const highHints = studentEvents.filter(
        (e) => e.type === "hint_level_granted" && Number(e.metadata.level) >= 3
      );
      if (highHints.length >= 3) {
        const uniqueTasks = new Set(highHints.map((e) => e.taskId)).size;
        notes.push({
          studentId: student.id,
          studentName: student.name,
          kind: "repeated-difficulty",
          detail: `Level 3 or higher guidance requested ${highHints.length} times across ${uniqueTasks} task(s). Consider checking in directly.`,
        });
      }

      // 3. Observation needed (>= 5 events but no teacher observation recorded yet)
      const hasObservation = studentEvents.some((e) => e.type === "teacher_observation");
      if (studentEvents.length >= 5 && !hasObservation) {
        notes.push({
          studentId: student.id,
          studentName: student.name,
          kind: "observation-needed",
          detail: "Active task engagement recorded, but no qualitative teacher observation has been added yet.",
        });
      }
    }

    return notes;
  }
}

export const teacherService = new TeacherService();
