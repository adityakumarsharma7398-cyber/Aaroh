import { Router, Request, Response } from "express";
import studentRoutes from "./student.routes";
import teacherRoutes from "./teacher.routes";
import taskRoutes from "./tasks.routes";
import mentorRoutes, { handleHintRequest } from "./mentor.routes";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";
import { checkDatabaseConnection } from "../db/client";

const apiRouter = Router();

// Health check endpoint (public)
apiRouter.get("/health", async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Current user profile endpoint (authenticated for any role)
apiRouter.get("/me", authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    data: req.user,
  });
});

// 7. Server-controlled hint: POST /api/hint
// Request must be exactly { "taskId": "..." }
apiRouter.post("/hint", authenticate, handleHintRequest);

// Mount domain routes
apiRouter.use("/student", studentRoutes);
apiRouter.use("/teacher", teacherRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/mentor", mentorRoutes);

export default apiRouter;
