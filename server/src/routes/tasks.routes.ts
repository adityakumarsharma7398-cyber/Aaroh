import { Router, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { studentService } from "../services/student.service";
import { hintService } from "../services/hint.service";

const router = Router();

// Tasks routes require authentication
router.use(authenticate);

/**
 * GET /api/tasks/:taskId
 * Returns task details and historical attempts for authenticated student.
 */
router.get("/:taskId", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const result = await studentService.getTaskById(req.user!.id, taskId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:taskId/attempts
 * Submits student work attempt.
 */
router.post("/:taskId/attempts", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
 * POST /api/tasks/:taskId/complete
 * Marks task as completed.
 */
router.post("/:taskId/complete", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const result = await studentService.completeTask(req.user!.id, taskId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:taskId/mentor
 * Retrieves mentor guidance session for task.
 */
router.get("/:taskId/mentor", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const session = await hintService.getMentorSession(req.user!.id, taskId);
    res.json({ data: session });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:taskId/mentor/hint
 * Requests next hint level from mentor.
 */
router.post("/:taskId/mentor/hint", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
 * GET /api/tasks/:taskId/reflection
 * Retrieves previous reflection for task.
 */
router.get("/:taskId/reflection", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const reflection = await studentService.getTaskReflection(req.user!.id, taskId);
    res.json({ data: reflection });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:taskId/reflection
 * Submits reflection answers.
 */
router.post("/:taskId/reflection", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
    const { answers } = req.body || {};
    const reflection = await studentService.submitReflection(req.user!.id, taskId, answers);
    res.status(201).json({ data: reflection });
  } catch (err) {
    next(err);
  }
});

export default router;
