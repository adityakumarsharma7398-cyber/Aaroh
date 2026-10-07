import { Router, Response, NextFunction } from "express";
import { authenticate, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { teacherService } from "../services/teacher.service";

const router = Router();

// Enforce teacher role on all /api/teacher routes
router.use(authenticate);
router.use(requireRole("teacher"));

/**
 * 12. GET /api/teacher/students
 * Lists all students belonging to teacher's class with activity summary.
 */
router.get("/students", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const students = await teacherService.listStudents(req.user!);
    res.json({ data: students });
  } catch (err) {
    next(err);
  }
});

/**
 * 13. GET /api/teacher/students/:studentId
 * In-depth overview for a student: profile, signals, evidence, and recent events.
 */
router.get("/students/:studentId", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const overview = await teacherService.getStudentOverview(req.user!, studentId);
    res.json({ data: overview });
  } catch (err) {
    next(err);
  }
});

/**
 * 17. GET /api/teacher/students/:studentId/evidence
 * Retrieves evidence records for a specific student.
 */
router.get("/students/:studentId/evidence", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const evidenceList = await teacherService.getStudentEvidence(req.user!, studentId);
    res.json({ data: evidenceList });
  } catch (err) {
    next(err);
  }
});

/**
 * 14. GET /api/teacher/activities
 * Lists all curriculum activities (academic tasks).
 */
router.get("/activities", async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const activities = await teacherService.listActivities();
    res.json({ data: activities });
  } catch (err) {
    next(err);
  }
});

/**
 * 14. POST /api/teacher/activities
 * Creates a new curriculum activity/task.
 */
router.post("/activities", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const activity = await teacherService.createActivity(req.user!.id, req.body || {});
    res.status(201).json({ data: activity });
  } catch (err) {
    next(err);
  }
});

/**
 * 14. GET /api/teacher/events
 * Lists recent observable events across students in the teacher's class.
 */
router.get("/events", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const events = await teacherService.listClassEvents(req.user!, limit);
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * 15. GET /api/teacher/signals
 * Lists development signals for all students in the teacher's class.
 */
router.get("/signals", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const signals = await teacherService.listClassSignals(req.user!);
    res.json({ data: signals });
  } catch (err) {
    next(err);
  }
});

/**
 * 15. GET /api/teacher/group-signals
 * Returns qualitative class-level development summary per dimension.
 */
router.get("/group-signals", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const groupSignals = await teacherService.getGroupSignals(req.user!);
    res.json({ data: groupSignals });
  } catch (err) {
    next(err);
  }
});

/**
 * 16. GET /api/teacher/evidence
 * Lists all derived evidence records for students in the teacher's class.
 */
router.get("/evidence", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const evidenceList = await teacherService.listClassEvidence(req.user!);
    res.json({ data: evidenceList });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teacher/observations
 * Lists qualitative teacher observations. Supports ?studentId=...
 */
router.get("/observations", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.query.studentId as string | undefined;
    const observations = await teacherService.listObservations(studentId);
    res.json({ data: observations });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teacher/observations
 * Records a qualitative teacher observation and emits a 'teacher_observation' event.
 */
router.post("/observations", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const observation = await teacherService.recordObservation(req.user!, req.body || {});
    res.status(201).json({ data: observation });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teacher/attention-notes
 * Returns backend-derived attention prompts based on observable action thresholds.
 */
router.get("/attention-notes", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const notes = await teacherService.deriveAttentionNotes(req.user!);
    res.json({ data: notes });
  } catch (err) {
    next(err);
  }
});

export default router;
