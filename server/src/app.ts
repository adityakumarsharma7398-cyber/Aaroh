import express, { Request, Response } from "express";
import cors from "cors";
import { checkDatabaseConnection } from "./db/client";
import type { Student } from "@education-growth/shared";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint verifying database connectivity and shared type usage
app.get("/api/health", async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();

  // Demonstrate using a shared contract type on the server
  const sampleStudent: Student = {
    id: "sample-demo-student",
    name: "Foundation Check Student",
    email: "student@hackathon.local",
    createdAt: new Date().toISOString(),
  };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    sampleContractCheck: sampleStudent,
  });
});

if (process.env.NODE_ENV !== "test") {
  checkDatabaseConnection().then((dbStatus) => {
    console.log(`[Database] SQLite connected at ${dbStatus.path} (status: ${dbStatus.ok ? "OK" : "FAILED"})`);
  });

  app.listen(PORT, () => {
    console.log(`[Server] Express listening on http://localhost:${PORT}`);
  });
}

export default app;
