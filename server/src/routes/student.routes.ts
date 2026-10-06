import { Router, Response, NextFunction } from "express";
import { authenticate, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { studentService } from "../services/student.service";
import { hintService } from "../services/hint.service";

const router = Router();

// Enforce student role on all /api/student routes
router.use(authenticate);
router.use(requireRole("student"));

/**
 * 1. GET /api/student/me
 * Retrieves current student's profile.
 */
router.get("/me", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const student = await studentService.getCurrentStudent(req.user!.id);
    res.json({ data: student });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/student/tasks
 * Lists tasks assigned to the student with derived status (not-started, in-progress, completed).
 */
router.get("/tasks", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await studentService.listStudentTasks(req.user!.id);
    res.json({ data: tasks });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. GET /api/student/tasks/current
 * Returns the current/recommended task for the student.
 */
router.get("/tasks/current", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const currentTask = await studentService.getCurrentTask(req.user!.id);
    res.json({ data: currentTask });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/student/tasks/:taskId
 * Returns task details and historical attempts.
 */
router.get("/tasks/:taskId", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const result = await studentService.getTaskById(req.user!.id, taskId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. POST /api/student/tasks/:taskId/attempts
 * Submits a task attempt and records an observable event.
 */
router.post("/tasks/:taskId/attempts", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const { content } = req.body || {};
    const attempt = await studentService.submitTaskAttempt(req.user!.id, taskId, content);
    res.status(201).json({ data: attempt });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/student/tasks/:taskId/complete
 * Completes a task and records an observable 'completed' event.
 */
router.post("/tasks/:taskId/complete", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const result = await studentService.completeTask(req.user!.id, taskId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/tasks/:taskId/mentor
 * Retrieves current mentor guidance session for the task.
 */
router.get("/tasks/:taskId/mentor", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const session = await hintService.getMentorSession(req.user!.id, taskId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
});

/**
 * 10. POST /api/student/tasks/:taskId/mentor/hint
 * Authoritatively requests the next hint level.
 * Server determines the level; client cannot provide a 'level'.
 */
router.post("/tasks/:taskId/mentor/hint", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const { attempt, level } = req.body || {};
    const hint = await hintService.requestMentorHint(req.user!.id, taskId, attempt, level);
    res.status(200).json({ data: hint });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/tasks/:taskId/reflection
 * Retrieves previous reflection answers for this task.
 */
router.get("/tasks/:taskId/reflection", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const reflection = await studentService.getTaskReflection(req.user!.id, taskId);
    res.json({ data: reflection });
  } catch (err) {
    next(err);
  }
});

/**
 * 11. POST /api/student/tasks/:taskId/reflection
 * Submits student reflection and records a 'reflection' event.
 */
router.post("/tasks/:taskId/reflection", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const { answers } = req.body || {};
    const reflection = await studentService.submitReflection(req.user!.id, taskId, answers);
    res.status(201).json({ data: reflection });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. GET /api/student/missions/current
 * Returns active development mission.
 */
router.get("/missions/current", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mission = await studentService.getCurrentMission(req.user!.id);
    res.json({ data: mission });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/missions
 * Lists all missions assigned to the student.
 */
router.get("/missions", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const missions = await studentService.listStudentMissions(req.user!.id);
    res.json({ data: missions });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/student/missions/:missionId/attempts
 * Completes a development mission practical action.
 */
router.post("/missions/:missionId/attempts", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const missionId = Array.isArray(req.params.missionId) ? req.params.missionId[0] : req.params.missionId;
    const { note } = req.body || {};
    const attempt = await studentService.submitMissionAttempt(req.user!.id, missionId, note);
    res.status(201).json({ data: attempt });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. GET /api/student/events
 * Lists student's observable events. Supports ?limit=N.
 */
router.get("/events", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const events = await studentService.getStudentEventsList(req.user!.id, limit);
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/events/recent
 * Returns the 5 most recent observable events.
 */
router.get("/events/recent", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const events = await studentService.getStudentEventsList(req.user!.id, 5);
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/evidence
 * Returns derived evidence records for the student.
 */
router.get("/evidence", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const evidenceList = await studentService.getStudentEvidenceRecords(req.user!.id);
    res.json({ data: evidenceList });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. GET /api/student/signals
 * Returns deterministic development signals for all 5 dimensions.
 */
router.get("/signals", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const signals = await studentService.getStudentSignals(req.user!.id);
    res.json({ data: signals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/student/signals/:dimension
 * Returns development signal for a specific dimension.
 */
router.get("/signals/:dimension", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dimension = Array.isArray(req.params.dimension) ? req.params.dimension[0] : req.params.dimension;
    const signal = await studentService.getStudentDimensionSignal(req.user!.id, dimension);
    res.json({ data: signal });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. GET /api/student/insight
 * Returns latest growth insight grounded in observable evidence.
 */
router.get("/insight", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const insight = await studentService.getLatestGrowthInsight(req.user!.id);
    res.json({ data: insight });
  } catch (err) {
    next(err);
  }
});

export default router;
