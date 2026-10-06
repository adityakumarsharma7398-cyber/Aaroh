import express, { Request, Response } from "express";
import cors from "cors";
import apiRouter from "./routes/index";
import { errorHandler } from "./middleware/error";
import { checkDatabaseConnection } from "./db/client";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount all API endpoints under /api
app.use("/api", apiRouter);

// Handle 404 for unmatched API routes
app.use("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint does not exist.",
    },
  });
});

// Centralized error handling middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  checkDatabaseConnection().then((dbStatus) => {
    console.log(
      `[Database] SQLite connected at ${dbStatus.path} (status: ${dbStatus.ok ? "OK" : "FAILED"})`
    );
  });

  app.listen(PORT, () => {
    console.log(`[Server] Express listening on http://localhost:${PORT}`);
  });
}

export default app;
