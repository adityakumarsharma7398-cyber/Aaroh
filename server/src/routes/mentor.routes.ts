import { Router, Response, NextFunction } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { hintService } from "../services/hint.service";
import { ApiError } from "../middleware/error";

const router = Router();

router.use(authenticate);

/**
 * Handles hint request.
 * Enforces that client specifies ONLY { "taskId": "..." } (with optional attempt context).
 * Strictly forbids client-supplied 'level', 'hintLevel', or 'requestedLevel'.
 */
export async function handleHintRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId, attempt, level, hintLevel, requestedLevel } = req.body || {};
    const forbiddenLevelParam = level ?? hintLevel ?? requestedLevel;

    if (!taskId || typeof taskId !== "string" || taskId.trim().length === 0) {
      throw new ApiError(400, "INVALID_TASK_ID", "A valid 'taskId' is required in the request body.");
    }

    const hint = await hintService.requestMentorHint(
      req.user!.id,
      taskId.trim(),
      attempt,
      forbiddenLevelParam
    );

    res.status(200).json({ data: hint });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/mentor/hint (compatibility alias)
 */
router.post("/hint", handleHintRequest);

export default router;
