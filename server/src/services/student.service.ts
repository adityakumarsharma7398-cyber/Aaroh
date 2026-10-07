import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/client";
import { profiles, tasks, missions, events } from "../db/schema";
import { recordEvent, getStudentEvents } from "../events/logger";
import { generateEvidence, persistEvidence, getStudentEvidence } from "../engine/evidence";
import { generateDevelopmentSignals } from "../engine/signals";
import { ApiError } from "../middleware/error";
import type {
  Profile,
  AcademicTask,
  Mission,
  ObservableEvent,
  EvidenceRecord,
  ObservableDevelopmentSignal,
  DevelopmentDimension,
} from "@education-growth/shared";

export interface TaskWithProgress extends AcademicTask {
  status: "not-started" | "in-progress" | "completed";
  attemptsCount: number;
  lastAttemptAt?: string | null;
}

export interface TaskAttemptSummary {
  id: string;
  studentId: string;
  taskId: string;
  content: string;
  createdAt: string;
  isRetry: boolean;
}

export interface ReflectionAnswer {
  prompt: string;
  response: string;
}

export interface ReflectionRecord {
  id: string;
  studentId: string;
  taskId: string;
  answers: ReflectionAnswer[];
  createdAt: string;
}

export interface GrowthInsight {
  id: string;
  studentId: string;
  observation: string;
  evidenceEventIds: string[];
}

export class StudentService {
  /**
   * Retrieves profile for authenticated student.
   */
  async getCurrentStudent(studentId: string): Promise<Profile> {
    const records = await db.select().from(profiles).where(eq(profiles.id, studentId)).limit(1);
    if (records.length === 0) {
      throw new ApiError(404, "STUDENT_NOT_FOUND", `Student profile '${studentId}' not found.`);
    }
    return records[0] as Profile;
  }

  /**
   * Lists all academic tasks for the student with derived progress status.
   * Progress status is authoritatively derived from observable events:
   * - 'completed': task has a completed event
   * - 'in-progress': task has attempt or retry events
   * - 'not-started': no events recorded yet
   */
  async listStudentTasks(studentId: string): Promise<TaskWithProgress[]> {
    const allTasks = await db.select().from(tasks);
    const studentEvents = await getStudentEvents(studentId);

    return allTasks.map((task) => {
      const taskEvents = studentEvents.filter((e) => e.taskId === task.id);
      const isCompleted = taskEvents.some((e) => e.type === "completed");
      const attempts = taskEvents.filter((e) => e.type === "attempt" || e.type === "retry");
      const hasAttempts = attempts.length > 0;

      let status: "not-started" | "in-progress" | "completed" = "not-started";
      if (isCompleted) {
        status = "completed";
      } else if (hasAttempts) {
        status = "in-progress";
      }

      const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1].createdAt : null;

      return {
        ...task,
        status,
        attemptsCount: attempts.length,
        lastAttemptAt: lastAttempt,
      };
    });
  }

  /**
   * Returns the current/recommended task for the student:
   * Priority: work already under way ('in-progress') first, then next 'not-started'.
   */
  async getCurrentTask(studentId: string): Promise<TaskWithProgress | null> {
    const tasksWithProgress = await this.listStudentTasks(studentId);
    const inProgress = tasksWithProgress.find((t) => t.status === "in-progress");
    if (inProgress) return inProgress;

    const notStarted = tasksWithProgress.find((t) => t.status === "not-started");
    return notStarted || null;
  }

  /**
   * Retrieves specific task with progress details and historical attempts.
   */
  async getTaskById(studentId: string, taskId: string): Promise<{
    task: TaskWithProgress;
    attempts: TaskAttemptSummary[];
  }> {
    const matched = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (matched.length === 0) {
      throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' was not found.`);
    }

    const task = matched[0];
    const studentEvents = await getStudentEvents(studentId);
    const taskEvents = studentEvents.filter((e) => e.taskId === taskId);

    const isCompleted = taskEvents.some((e) => e.type === "completed");
    const attemptEvents = taskEvents.filter((e) => e.type === "attempt" || e.type === "retry");

    let status: "not-started" | "in-progress" | "completed" = "not-started";
    if (isCompleted) {
      status = "completed";
    } else if (attemptEvents.length > 0) {
      status = "in-progress";
    }

    const attempts: TaskAttemptSummary[] = attemptEvents
      .map((ev) => ({
        id: ev.id,
        studentId: ev.studentId,
        taskId: ev.taskId!,
        content: String(ev.metadata.content || ""),
        createdAt: ev.createdAt,
        isRetry: ev.type === "retry",
      }))
      .reverse(); // newest first

    return {
      task: {
        ...task,
        status,
        attemptsCount: attemptEvents.length,
        lastAttemptAt: attempts.length > 0 ? attempts[0].createdAt : null,
      },
      attempts,
    };
  }

  /**
   * Submits a student work attempt for a task.
   * 
   * Authoritatively:
   * 1. Verifies task existence.
   * 2. Checks prior attempt history: emits 'retry' if previous attempt exists, else 'attempt'.
   * 3. Records observable event into events table.
   * 4. Triggers deterministic evidence generation and persistence.
   */
  async submitTaskAttempt(
    studentId: string,
    taskId: string,
    content: string
  ): Promise<TaskAttemptSummary> {
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new ApiError(400, "INVALID_ATTEMPT_CONTENT", "Attempt content is required and cannot be empty.");
    }

    const matchedTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (matchedTask.length === 0) {
      throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' not found.`);
    }

    const studentEvents = await getStudentEvents(studentId);
    const priorAttempts = studentEvents.filter(
      (e) => e.taskId === taskId && (e.type === "attempt" || e.type === "retry")
    );

    const isRetry = priorAttempts.length > 0;
    const eventType = isRetry ? "retry" : "attempt";

    // Record observable event
    const eventRecord = await recordEvent({
      studentId,
      taskId,
      type: eventType,
      source: "student",
      metadata: {
        content: content.trim(),
        contentLength: content.trim().length,
      },
    });

    // Run and persist deterministic evidence pipeline
    const updatedEvents = await getStudentEvents(studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      id: eventRecord.id,
      studentId,
      taskId,
      content: content.trim(),
      createdAt: eventRecord.createdAt,
      isRetry,
    };
  }

  /**
   * Marks a task completed by the student.
   * Records a 'completed' event and triggers evidence derivation.
   */
  async completeTask(studentId: string, taskId: string): Promise<{ taskId: string; status: string }> {
    const matchedTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (matchedTask.length === 0) {
      throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' not found.`);
    }

    await recordEvent({
      studentId,
      taskId,
      type: "completed",
      source: "student",
      metadata: {
        completedAt: new Date().toISOString(),
      },
    });

    // Run and persist deterministic evidence
    const updatedEvents = await getStudentEvents(studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      taskId,
      status: "completed",
    };
  }

  /**
   * Lists development missions assigned to the student.
   */
  async listStudentMissions(studentId: string): Promise<Mission[]> {
    const list = await db.select().from(missions).where(eq(missions.studentId, studentId));
    return list as Mission[];
  }

  /**
   * Retrieves active development mission for student.
   */
  async getCurrentMission(studentId: string): Promise<Mission | null> {
    const list = await this.listStudentMissions(studentId);
    const active = list.find((m) => m.status === "active");
    return active || (list.length > 0 ? list[0] : null);
  }

  /**
   * Submits a completed practical action for a mission.
   * Updates mission status and logs a completion event.
   */
  async submitMissionAttempt(
    studentId: string,
    missionId: string,
    note: string
  ): Promise<{ id: string; studentId: string; missionId: string; note: string; status: string }> {
    if (!note || typeof note !== "string" || note.trim().length === 0) {
      throw new ApiError(400, "INVALID_NOTE", "Mission attempt description is required.");
    }

    const matched = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
    if (matched.length === 0) {
      throw new ApiError(404, "MISSION_NOT_FOUND", `Mission '${missionId}' not found.`);
    }

    const mission = matched[0];
    if (mission.studentId !== studentId) {
      throw new ApiError(403, "FORBIDDEN", "You are not assigned to this mission.");
    }

    // Update mission status to completed
    await db.update(missions).set({ status: "completed" }).where(eq(missions.id, missionId));

    // Record observable completion event for the mission
    await recordEvent({
      studentId,
      taskId: mission.taskId,
      type: "completed",
      source: "student",
      metadata: {
        missionId,
        note: note.trim(),
        action: "mission_completed",
      },
    });

    const updatedEvents = await getStudentEvents(studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      id: randomUUID(),
      studentId,
      missionId,
      note: note.trim(),
      status: "completed",
    };
  }

  /**
   * Submits student reflection answers.
   * Records a 'reflection' event and triggers evidence derivation.
   */
  async submitReflection(
    studentId: string,
    taskId: string,
    answers: ReflectionAnswer[]
  ): Promise<ReflectionRecord> {
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new ApiError(400, "INVALID_ANSWERS", "At least one reflection answer is required.");
    }

    const validAnswers = answers.filter((a) => a && typeof a.response === "string" && a.response.trim().length > 0);
    if (validAnswers.length === 0) {
      throw new ApiError(400, "INVALID_ANSWERS", "Reflection response cannot be empty.");
    }

    const matchedTask = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (matchedTask.length === 0) {
      throw new ApiError(404, "TASK_NOT_FOUND", `Task '${taskId}' not found.`);
    }

    const totalLength = validAnswers.reduce((sum, a) => sum + a.response.trim().length, 0);

    const eventRecord = await recordEvent({
      studentId,
      taskId,
      type: "reflection",
      source: "student",
      metadata: {
        answers: validAnswers,
        responseLength: totalLength,
      },
    });

    const updatedEvents = await getStudentEvents(studentId);
    const derivedEvidence = generateEvidence(updatedEvents);
    await persistEvidence(derivedEvidence);

    return {
      id: eventRecord.id,
      studentId,
      taskId,
      answers: validAnswers,
      createdAt: eventRecord.createdAt,
    };
  }

  /**
   * Retrieves previous reflection for a task if one exists.
   */
  async getTaskReflection(studentId: string, taskId: string): Promise<ReflectionRecord | null> {
    const studentEvents = await getStudentEvents(studentId);
    const reflectionEvent = studentEvents
      .filter((e) => e.taskId === taskId && e.type === "reflection")
      .pop();

    if (!reflectionEvent) return null;

    const answers = Array.isArray(reflectionEvent.metadata.answers)
      ? (reflectionEvent.metadata.answers as ReflectionAnswer[])
      : [];

    return {
      id: reflectionEvent.id,
      studentId,
      taskId,
      answers,
      createdAt: reflectionEvent.createdAt,
    };
  }

  /**
   * Returns deterministic development signals for the student across all 5 dimensions.
   */
  async getStudentSignals(studentId: string): Promise<ObservableDevelopmentSignal[]> {
    const studentEvents = await getStudentEvents(studentId);
    return generateDevelopmentSignals(studentEvents);
  }

  /**
   * Returns signal for a specific dimension.
   */
  async getStudentDimensionSignal(
    studentId: string,
    rawDimension: string
  ): Promise<ObservableDevelopmentSignal> {
    const normalized = rawDimension.toLowerCase().replace(/-/g, "_") as DevelopmentDimension;
    const signals = await this.getStudentSignals(studentId);
    const found = signals.find((s) => s.dimension === normalized);

    if (!found) {
      throw new ApiError(
        400,
        "INVALID_DIMENSION",
        `Unknown development dimension '${rawDimension}'. Allowed: self_reliance, perseverance, problem_solving, initiative, sustained_engagement.`
      );
    }
    return found;
  }

  /**
   * Generates latest growth insight grounded in observable evidence.
   */
  async getLatestGrowthInsight(studentId: string): Promise<GrowthInsight> {
    const signals = await this.getStudentSignals(studentId);
    const positiveSignal = signals.find((s) => s.state === "positive");

    if (positiveSignal && positiveSignal.supportingEventIds.length > 0) {
      return {
        id: `ins-${positiveSignal.id}`,
        studentId,
        observation: positiveSignal.ruleExplanation,
        evidenceEventIds: positiveSignal.supportingEventIds,
      };
    }

    const studentEvents = await getStudentEvents(studentId);
    const recentIds = studentEvents.slice(-3).map((e) => e.id);

    return {
      id: `ins-baseline-${studentId}`,
      studentId,
      observation:
        "Building initial observable actions across academic curriculum tasks. Continue completing tasks and reflecting on your approach.",
      evidenceEventIds: recentIds,
    };
  }

  /**
   * Lists recent observable events for the student.
   */
  async getStudentEventsList(studentId: string, limit?: number): Promise<ObservableEvent[]> {
    const eventsList = await getStudentEvents(studentId);
    const sorted = [...eventsList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Retrieves derived evidence records for the student.
   */
  async getStudentEvidenceRecords(studentId: string): Promise<EvidenceRecord[]> {
    return getStudentEvidence(studentId);
  }
}

export const studentService = new StudentService();
