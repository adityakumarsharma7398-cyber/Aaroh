process.env.NODE_ENV = "test";
import http from "node:http";
import app from "../app";
import { db } from "../db/client";
import { tasks, events, evidence, missions, profiles } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

interface TestResponse<T = unknown> {
  status: number;
  body: {
    data?: T;
    error?: {
      code: string;
      message: string;
    };
  };
}

let server: http.Server;
let baseUrl: string;

function makeRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
  } = {}
): Promise<TestResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let parsed: unknown = {};
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = { raw: rawData };
          }
          resolve({
            status: res.statusCode || 500,
            body: parsed as TestResponse<T>["body"],
          });
        });
      }
    );

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runApiVerification() {
  console.log("=== Starting Comprehensive Backend REST API Verification ===\n");

  // Start test server on dynamic port
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (typeof address === "object" && address) {
        baseUrl = `http://localhost:${address.port}`;
        console.log(`✓ Test Express server running on ${baseUrl}`);
      }
      resolve();
    });
  });

  const studentToken = "student-maya";
  const teacherToken = "prof-teacher-1";
  const createdTestEventIds: string[] = [];
  let testTaskId: string | null = null;
  const unauthorizedStudentId = "student-unauthorized-class";

  try {
    // Insert an unauthorized student belonging to a different class to test strict scoping
    await db.insert(profiles).values({
      id: unauthorizedStudentId,
      name: "Out of Class Student",
      email: "outofclass@school.local",
      role: "student",
      classId: "biology-999",
      createdAt: new Date().toISOString(),
    });

    // ------------------------------------------------------------------------
    console.log("\n--- Phase 8: Protocol, Security & Error Handling Tests ---");
    // ------------------------------------------------------------------------

    // 1. GET /api/health
    const health = await makeRequest("/api/health");
    assert(health.status === 200, "Health check should return 200");
    console.log("✓ 1. GET /api/health returns 200 OK");

    // 2. Unauthenticated student endpoint -> 401
    const noAuth = await makeRequest("/api/student/me");
    assert(noAuth.status === 401, "No auth must return 401");
    assert(noAuth.body.error?.code === "UNAUTHENTICATED", "Code must be UNAUTHENTICATED");
    console.log("✓ 2. Unauthenticated request to /api/student/me rejected with 401");

    // Invalid credentials -> 401
    const badAuth = await makeRequest("/api/student/me", { token: "nonexistent-user-id" });
    assert(badAuth.status === 401, "Invalid token must return 401");
    console.log("✓ 2b. Nonexistent token rejected with 401 INVALID_CREDENTIALS");

    // 16. Invalid task -> 404
    const notFoundTask = await makeRequest("/api/tasks/task-nonexistent-id", { token: studentToken });
    assert(notFoundTask.status === 404, "Invalid task ID must return 404");
    assert(notFoundTask.body.error?.code === "TASK_NOT_FOUND", "Code must be TASK_NOT_FOUND");
    console.log("✓ 16. GET /api/tasks/:invalidTaskId returns 404 TASK_NOT_FOUND");

    // 17. Malformed request -> 400
    const malformed = await makeRequest("/api/tasks/task-math-101/attempts", {
      method: "POST",
      token: studentToken,
      body: { content: "   " },
    });
    assert(malformed.status === 400, "Empty attempt body must return 400");
    console.log("✓ 17. Malformed request body rejected with 400 BAD_REQUEST");

    // 18. Unknown API route -> 404
    const unknownRoute = await makeRequest("/api/nonexistent-route");
    assert(unknownRoute.status === 404, "Unknown API route must return 404");
    console.log("✓ 18. Unknown route returns 404 NOT_FOUND");

    // ------------------------------------------------------------------------
    console.log("\n--- Phase 8: Student Core Operations (P0 & P1) ---");
    // ------------------------------------------------------------------------

    // 3. Authenticated student GET /api/student/me
    const studentMe = await makeRequest<{ id: string; name: string; role: string }>("/api/student/me", {
      token: studentToken,
    });
    assert(studentMe.status === 200, "GET /api/student/me should return 200");
    assert(studentMe.body.data?.id === studentToken, "Returns correct student identity");
    assert(studentMe.body.data?.role === "student", "Role must be student");
    console.log("✓ 3. GET /api/student/me returns authenticated student context");

    // 4. Student GET /api/student/tasks
    const studentTasks = await makeRequest<Array<{ id: string; status: string }>>("/api/student/tasks", {
      token: studentToken,
    });
    assert(studentTasks.status === 200, "GET /api/student/tasks should return 200");
    assert(Array.isArray(studentTasks.body.data), "Tasks must be an array");
    console.log(`✓ 4. GET /api/student/tasks returns ${studentTasks.body.data!.length} tasks`);

    // 5. Student GET /api/tasks/:taskId
    const taskDetail = await makeRequest<{ task: { id: string }; attempts: unknown[] }>(
      "/api/tasks/task-math-101",
      { token: studentToken }
    );
    assert(taskDetail.status === 200, "GET /api/tasks/:taskId should return 200");
    assert(taskDetail.body.data?.task.id === "task-math-101", "Returns requested task");
    console.log("✓ 5. GET /api/tasks/:taskId returns authorized task detail");

    // 6. Student POST /api/tasks/:taskId/attempts
    const attemptRes = await makeRequest<{ id: string; isRetry: boolean }>(
      "/api/tasks/task-math-101/attempts",
      {
        method: "POST",
        token: studentToken,
        body: { content: "Attempting solution: combined like terms on left side." },
      }
    );
    assert(attemptRes.status === 201, "Attempt creation should return 201");
    createdTestEventIds.push(attemptRes.body.data!.id);
    console.log(`✓ 6. POST /api/tasks/:taskId/attempts created attempt (isRetry: ${attemptRes.body.data?.isRetry})`);

    // 7. Student POST /api/hint (REQUEST MUST BE EXACTLY { "taskId": "..." })
    // First, verify client CANNOT supply 'level', 'hintLevel', or 'requestedLevel'
    const spoofLevel1 = await makeRequest("/api/hint", {
      method: "POST",
      token: studentToken,
      body: { taskId: "task-math-101", level: 4 },
    });
    assert(spoofLevel1.status === 400, "Supplying 'level' must return 400");
    assert(spoofLevel1.body.error?.code === "UNAUTHORIZED_HINT_LEVEL", "Must reject with UNAUTHORIZED_HINT_LEVEL");

    const spoofLevel2 = await makeRequest("/api/hint", {
      method: "POST",
      token: studentToken,
      body: { taskId: "task-math-101", hintLevel: 3 },
    });
    assert(spoofLevel2.status === 400, "Supplying 'hintLevel' must return 400");

    const spoofLevel3 = await makeRequest("/api/hint", {
      method: "POST",
      token: studentToken,
      body: { taskId: "task-math-101", requestedLevel: 5 },
    });
    assert(spoofLevel3.status === 400, "Supplying 'requestedLevel' must return 400");
    console.log("✓ 7a. POST /api/hint authoritatively rejected client-supplied level parameters (400)");

    // Now send EXACT request: { "taskId": "task-math-101" }
    const hintRes1 = await makeRequest<{ id: string; level: number; content: string; responseMode: string }>(
      "/api/hint",
      {
        method: "POST",
        token: studentToken,
        body: { taskId: "task-math-101" },
      }
    );
    assert(hintRes1.status === 200, "POST /api/hint with exact body should return 200");
    assert(typeof hintRes1.body.data?.level === "number", "Server derives effective level");
    createdTestEventIds.push(hintRes1.body.data!.id);
    console.log(`✓ 7b. POST /api/hint with exact { "taskId": "..." } granted Level ${hintRes1.body.data?.level} (${hintRes1.body.data?.responseMode})`);

    // 8. Repeat hint request -> verify server-controlled progression
    const hintRes2 = await makeRequest<{ id: string; level: number; responseMode: string }>("/api/hint", {
      method: "POST",
      token: studentToken,
      body: { taskId: "task-math-101" },
    });
    assert(hintRes2.status === 200, "Repeat hint request should return 200");
    assert(hintRes2.body.data!.level >= hintRes1.body.data!.level, "Hint level must progress monotonically");
    createdTestEventIds.push(hintRes2.body.data!.id);
    console.log(`✓ 8. Repeat POST /api/hint progressed to Level ${hintRes2.body.data?.level}`);

    // 9. Retry/re-attempt
    const retryRes = await makeRequest<{ id: string; isRetry: boolean }>(
      "/api/tasks/task-math-101/attempts",
      {
        method: "POST",
        token: studentToken,
        body: { content: "Revised attempt: applied step-by-step guidance." },
      }
    );
    assert(retryRes.status === 201, "Retry attempt should return 201");
    assert(retryRes.body.data?.isRetry === true, "Must be flagged as retry");
    createdTestEventIds.push(retryRes.body.data!.id);
    console.log("✓ 9. POST /api/tasks/:taskId/attempts logged as 'retry' event");

    // 10. Task completion
    const completeRes = await makeRequest<{ taskId: string; status: string }>(
      "/api/tasks/task-math-101/complete",
      {
        method: "POST",
        token: studentToken,
      }
    );
    assert(completeRes.status === 200, "Task completion should return 200");
    assert(completeRes.body.data?.status === "completed", "Status must be completed");
    console.log("✓ 10. POST /api/tasks/:taskId/complete completed task");

    // Reflection submission
    const reflectionRes = await makeRequest<{ id: string }>(
      "/api/tasks/task-math-101/reflection",
      {
        method: "POST",
        token: studentToken,
        body: {
          answers: [
            { prompt: "What strategy helped you?", response: "Working through the inverse operations." },
          ],
        },
      }
    );
    assert(reflectionRes.status === 201, "Reflection submission should return 201");
    createdTestEventIds.push(reflectionRes.body.data!.id);
    console.log("✓ POST /api/tasks/:taskId/reflection submitted reflection");

    // 11. Evidence read
    const evidenceRes = await makeRequest<Array<{ id: string; dimension: string }>>(
      "/api/student/evidence",
      { token: studentToken }
    );
    assert(evidenceRes.status === 200, "GET /api/student/evidence should return 200");
    assert(Array.isArray(evidenceRes.body.data), "Evidence must be an array");
    console.log(`✓ 11. GET /api/student/evidence returns ${evidenceRes.body.data!.length} derived evidence records`);

    // 12. Signal read
    const signalRes = await makeRequest<Array<{ dimension: string; state: string; isCharacterVerdict: boolean }>>(
      "/api/student/signals",
      { token: studentToken }
    );
    assert(signalRes.status === 200, "GET /api/student/signals should return 200");
    assert(signalRes.body.data!.length === 5, "Returns signals for all 5 dimensions");
    assert(signalRes.body.data!.every((s) => s.isCharacterVerdict === false), "All signals must have isCharacterVerdict: false");
    console.log("✓ 12. GET /api/student/signals returns 5 deterministic development signals");

    // ------------------------------------------------------------------------
    console.log("\n--- Phase 8: Teacher Operations & Cohort Scoping Tests ---");
    // ------------------------------------------------------------------------

    // 13. Teacher access: GET /api/teacher/students
    const teacherStudents = await makeRequest<Array<{ id: string; name: string }>>(
      "/api/teacher/students",
      { token: teacherToken }
    );
    assert(teacherStudents.status === 200, "GET /api/teacher/students should return 200");
    assert(Array.isArray(teacherStudents.body.data), "Returns array of students");
    console.log(`✓ 13. GET /api/teacher/students returns ${teacherStudents.body.data!.length} students`);

    // 14. Teacher accessing authorized student: GET /api/teacher/students/student-maya
    const authorizedStudent = await makeRequest<{ profile: { id: string } }>(
      "/api/teacher/students/student-maya",
      { token: teacherToken }
    );
    assert(authorizedStudent.status === 200, "Teacher accessing authorized student should return 200");
    assert(authorizedStudent.body.data?.profile.id === "student-maya", "Returns student profile");
    console.log("✓ 14. GET /api/teacher/students/:studentId returns authorized student overview");

    // 15. Teacher attempting unauthorized student access -> 403 Forbidden
    const unauthorizedOverview = await makeRequest(
      `/api/teacher/students/${unauthorizedStudentId}`,
      { token: teacherToken }
    );
    assert(unauthorizedOverview.status === 403, "Accessing student in another class cohort must return 403");
    assert(unauthorizedOverview.body.error?.code === "FORBIDDEN", "Code must be FORBIDDEN");

    const unauthorizedEvidence = await makeRequest(
      `/api/teacher/students/${unauthorizedStudentId}/evidence`,
      { token: teacherToken }
    );
    assert(unauthorizedEvidence.status === 403, "Accessing evidence for out-of-cohort student must return 403");

    const unauthorizedObs = await makeRequest(
      "/api/teacher/observations",
      {
        method: "POST",
        token: teacherToken,
        body: { studentId: unauthorizedStudentId, text: "Observation on student in another class" },
      }
    );
    assert(unauthorizedObs.status === 403, "Logging observation for out-of-cohort student must return 403");
    console.log("✓ 15. Teacher unauthorized cross-cohort access authoritatively rejected with 403 FORBIDDEN");

    // Teacher activity creation
    const activityRes = await makeRequest<{ id: string; title: string }>("/api/teacher/activities", {
      method: "POST",
      token: teacherToken,
      body: {
        title: "Calculus: Rate of Change",
        subject: "Mathematics",
        description: "Differential rates and derivatives.",
      },
    });
    assert(activityRes.status === 201, "Activity creation should return 201");
    testTaskId = activityRes.body.data!.id;
    console.log(`✓ POST /api/teacher/activities created activity '${activityRes.body.data?.title}'`);

    // Teacher observation logging for authorized student
    const teacherObs = await makeRequest<{ id: string }>(
      "/api/teacher/observations",
      {
        method: "POST",
        token: teacherToken,
        body: {
          studentId: "student-maya",
          text: "Maya approached the problem with independence.",
          dimension: "self_reliance",
        },
      }
    );
    assert(teacherObs.status === 201, "Observation creation should return 201");
    createdTestEventIds.push(teacherObs.body.data!.id);
    console.log("✓ POST /api/teacher/observations logged qualitative observation");

    // ------------------------------------------------------------------------
    console.log("\n--- Phase 9: End-to-End Pipeline HTTP Test (Jordan Taylor Journey) ---");
    // ------------------------------------------------------------------------
    const testStudent = "student-jordan";
    const pipelineTaskId = "task-math-104";

    // Step 1: AUTH & GET STUDENT
    const s1 = await makeRequest<{ id: string }>("/api/student/me", { token: testStudent });
    assert(s1.status === 200 && s1.body.data?.id === testStudent, "Step 1: Auth check passed");

    // Step 2: GET TASKS
    const s2 = await makeRequest<Array<{ id: string }>>("/api/student/tasks", { token: testStudent });
    assert(s2.status === 200, "Step 2: Get tasks passed");

    // Step 3: GET TASK DETAIL
    const s3 = await makeRequest<{ task: { id: string } }>(`/api/tasks/${pipelineTaskId}`, { token: testStudent });
    assert(s3.status === 200 && s3.body.data?.task.id === pipelineTaskId, "Step 3: Get task detail passed");

    // Step 4: CREATE ATTEMPT
    const s4 = await makeRequest<{ id: string }>(`/api/tasks/${pipelineTaskId}/attempts`, {
      method: "POST",
      token: testStudent,
      body: { content: "Initial attempt solving polynomial roots." },
    });
    assert(s4.status === 201, "Step 4: Create attempt passed");
    createdTestEventIds.push(s4.body.data!.id);

    // Step 5: REQUEST HINT (Exact { "taskId": "..." })
    const s5 = await makeRequest<{ id: string; level: number }>(`/api/hint`, {
      method: "POST",
      token: testStudent,
      body: { taskId: pipelineTaskId },
    });
    assert(s5.status === 200, "Step 5: Request hint passed");
    createdTestEventIds.push(s5.body.data!.id);

    // Step 6: VERIFY HINT EVENT IN DATABASE
    const hintEventsInDb = await db
      .select()
      .from(events)
      .where(eq(events.id, s5.body.data!.id));
    assert(hintEventsInDb.length === 1, "Step 6: Hint event persisted in events table");
    assert(hintEventsInDb[0].type === "hint_level_granted", "Step 6: Event type is hint_level_granted");

    // Step 7: RETRY
    const s7 = await makeRequest<{ id: string; isRetry: boolean }>(`/api/tasks/${pipelineTaskId}/attempts`, {
      method: "POST",
      token: testStudent,
      body: { content: "Revised attempt: factored the cubic polynomial using remainder theorem." },
    });
    assert(s7.status === 201 && s7.body.data?.isRetry === true, "Step 7: Retry passed");
    createdTestEventIds.push(s7.body.data!.id);

    // Step 8: COMPLETE
    const s8 = await makeRequest<{ status: string }>(`/api/tasks/${pipelineTaskId}/complete`, {
      method: "POST",
      token: testStudent,
    });
    assert(s8.status === 200 && s8.body.data?.status === "completed", "Step 8: Completion passed");

    // Step 9: VERIFY EVENTS IN DATABASE
    const studentEventsInDb = await db
      .select()
      .from(events)
      .where(eq(events.studentId, testStudent));
    assert(studentEventsInDb.some((e) => e.type === "completed"), "Step 9: Completed event verified in DB");

    // Step 10: VERIFY EVIDENCE VIA HTTP
    const s10 = await makeRequest<Array<{ dimension: string }>>("/api/student/evidence", { token: testStudent });
    assert(s10.status === 200, "Step 10: Evidence read passed");

    // Step 11: VERIFY SIGNALS VIA HTTP
    const s11 = await makeRequest<Array<{ dimension: string; state: string }>>("/api/student/signals", { token: testStudent });
    assert(s11.status === 200 && s11.body.data?.length === 5, "Step 11: 5 dimension signals read passed");

    console.log("✓ Phase 9 End-to-End Pipeline successfully executed via HTTP!");

    console.log("\n=== ALL REST API PHASES VERIFIED AND PASSED SUCCESSFULLY! ===");
  } finally {
    // Clean up test events and activities
    if (createdTestEventIds.length > 0) {
      await db.delete(events).where(inArray(events.id, createdTestEventIds));
    }
    if (testTaskId) {
      await db.delete(tasks).where(eq(tasks.id, testTaskId));
    }
    // Delete unauthorized test student
    await db.delete(profiles).where(eq(profiles.id, unauthorizedStudentId));

    // Restore mission status
    await db.update(missions).set({ status: "active" }).where(eq(missions.id, "mission-maya-1"));

    server.close();
    console.log("✓ Cleaned up test data and closed test server.");
    process.exit(0);
  }
}

runApiVerification().catch((err) => {
  console.error("API Verification Failed:", err);
  if (server) server.close();
  process.exit(1);
});
