# AAROH Backend REST API Contracts

This document specifies the authoritative HTTP REST API contracts for the AAROH backend.

All endpoints adhere to stable JSON envelope patterns:
- **Success**: `{ "data": ... }`
- **Error**: `{ "error": { "code": "...", "message": "..." } }`

**Base URL**: `http://localhost:3001`

---

## Standard HTTP Status Codes

- `200 OK`: Successful read or update
- `201 Created`: Successful resource creation
- `400 Bad Request`: Validation failure or client-supplied forbidden parameters (e.g., attempting to dictate hint level)
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated user lacks the required role or ownership
- `404 Not Found`: Target resource does not exist
- `500 Internal Server Error`: Unexpected server exception

---

## Development Authentication Contract

Protected endpoints require:
- Header: `Authorization: Bearer <user_id>` or `x-user-id: <user_id>`
- The server checks the identity against the database `profiles` table.
- **Client-supplied `studentId`, `role`, or `teacherId` in query/body are never trusted.** Identity is authoritatively derived from the authenticated session.
- Pre-seeded test identities:
  - Students: `student-maya`, `student-leo`, `student-aisha`, `student-jordan`
  - Teachers: `prof-teacher-1`

### Example Curl Requests

```bash
# Public health check
curl -X GET http://localhost:3001/api/health

# Authenticated student profile
curl -X GET http://localhost:3001/api/student/me \
  -H "Authorization: Bearer student-maya"

# Student tasks
curl -X GET http://localhost:3001/api/student/tasks \
  -H "Authorization: Bearer student-maya"

# Submit attempt
curl -X POST http://localhost:3001/api/tasks/task-math-101/attempts \
  -H "Authorization: Bearer student-maya" \
  -H "Content-Type: application/json" \
  -d '{"content": "Subtracted constant from both sides."}'

# Server-controlled hint (EXACT BODY ONLY)
curl -X POST http://localhost:3001/api/hint \
  -H "Authorization: Bearer student-maya" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "task-math-101"}'

# Teacher student roster
curl -X GET http://localhost:3001/api/teacher/students \
  -H "Authorization: Bearer prof-teacher-1"
```

---

## Authoritative Hint Contract

### `POST /api/hint`

**CRITICAL PRINCIPLE**: The client does **NOT** select the hint level.  
The backend derives the permitted/effective hint level from the student's existing hint history and observable attempt events.

**Request Body (MUST BE EXACTLY)**:
```json
{
  "taskId": "task-math-101"
}
```

*Forbidden parameters*:  
If the client provides `"hintLevel"`, `"level"`, or `"requestedLevel"`, the server will reject the request with `400 Bad Request`:
```json
{
  "error": {
    "code": "UNAUTHORIZED_HINT_LEVEL",
    "message": "Hint level is server-controlled. Clients must not supply 'level', 'hintLevel', or 'requestedLevel'."
  }
}
```

**Server Hint Progression Logic**:
1. Checks prior `hint_level_granted` events for that student and task.
2. If no hints granted yet:
   - If student has submitted an attempt or provided attempt description: grants **Level 1** (Reflective prompt).
   - If student has not submitted any attempt: returns **Level 0** (Independent thinking pushback: *"Before I give you a hint, tell me exactly where you are stuck and what you have tried."*).
3. If hints have already been granted:
   - Identifies highest granted level so far.
   - Advances guidance strictly one step at a time (`highest + 1`), capped at **Level 5** (Direct worked solution).
4. Records `hint_requested` event.
5. Records `hint_level_granted` event.
6. Evaluates and persists deterministic evidence (e.g., `SR-01` Self-Reliance).

**Success Response (`200 OK`)**:
```json
{
  "data": {
    "id": "ev-uuid",
    "taskId": "task-math-101",
    "level": 1,
    "content": "What is your main goal when isolating the variable in a linear equation? Which terms can you combine first?",
    "responseMode": "reflective_prompt",
    "grantedAt": "2026-10-07T04:30:00.000Z"
  }
}
```

---

## Complete API Reference

### 1. `GET /api/health`
- **Auth**: Public
- **Success**: `{ "status": "ok", "timestamp": "...", "database": { "ok": true } }`
- **Errors**: `500`

### 2. `GET /api/me`
- **Auth**: Any valid user
- **Success**: `{ "data": { "id": "...", "name": "...", "role": "student|teacher", ... } }`
- **Errors**: `401 UNAUTHENTICATED`, `401 INVALID_CREDENTIALS`

### 3. `GET /api/student/me`
- **Auth**: `role: student`
- **Success**: Authenticated student profile
- **Errors**: `401`, `403 FORBIDDEN` (if accessed by teacher)

### 4. `GET /api/student/tasks`
- **Auth**: `role: student`
- **Success**: Array of tasks with authoritatively derived progress status:
  - `not-started`: No events recorded yet
  - `in-progress`: Attempt or retry recorded
  - `completed`: Completion event recorded

### 5. `GET /api/student/tasks/current`
- **Auth**: `role: student`
- **Success**: Recommended task (in-progress prioritized, otherwise next unstarted)

### 6. `GET /api/tasks/:taskId` *(Alias: `GET /api/student/tasks/:taskId`)*
- **Auth**: `role: student`
- **Success**: Task detail with student's own attempts history. Cross-student attempt leakage is prevented.
- **Errors**: `404 TASK_NOT_FOUND`

### 7. `POST /api/tasks/:taskId/attempts` *(Alias: `POST /api/student/tasks/:taskId/attempts`)*
- **Auth**: `role: student`
- **Request**: `{ "content": "My step-by-step solution..." }`
- **Response**: `201 Created`
- **Events**: Records `attempt` (or `retry` if prior attempt exists on that task). Triggers deterministic evidence generation.
- **Errors**: `400 INVALID_ATTEMPT_CONTENT`, `404 TASK_NOT_FOUND`

### 8. `POST /api/tasks/:taskId/complete` *(Alias: `POST /api/student/tasks/:taskId/complete`)*
- **Auth**: `role: student`
- **Request**: `{}`
- **Response**: `200 OK` `{ "data": { "taskId": "...", "status": "completed" } }`
- **Events**: Records `completed` event. Triggers evidence generation.

### 9. `GET /api/tasks/:taskId/mentor` *(Alias: `GET /api/student/tasks/:taskId/mentor`)*
- **Auth**: `role: student`
- **Success**: `{ "data": { "taskId": "...", "currentLevel": 1, "hints": [...] } }`

### 10. `POST /api/hint` *(Aliases: `POST /api/tasks/:taskId/mentor/hint`, `POST /api/mentor/hint`)*
- **Auth**: `role: student`
- **Request**: `{ "taskId": "..." }` (Client must not supply level)
- **Response**: `200 OK` (Next permitted level from ladder)
- **Events**: Records `hint_requested` and `hint_level_granted`. Triggers evidence derivation.

### 11. `GET /api/tasks/:taskId/reflection`
- **Auth**: `role: student`
- **Success**: Previous reflection record or `null`

### 12. `POST /api/tasks/:taskId/reflection`
- **Auth**: `role: student`
- **Request**: `{ "answers": [{ "prompt": "...", "response": "..." }] }`
- **Response**: `201 Created`
- **Events**: Records `reflection` event. Triggers evidence derivation.

### 13. `GET /api/student/missions/current`
- **Auth**: `role: student`
- **Success**: Current active development mission

### 14. `GET /api/student/missions`
- **Auth**: `role: student`
- **Success**: List of assigned missions

### 15. `POST /api/student/missions/:missionId/attempts`
- **Auth**: `role: student`
- **Request**: `{ "note": "What action was taken..." }`
- **Response**: `201 Created`
- **Events**: Updates mission status to `completed`, records `completed` event with mission metadata.

### 16. `GET /api/student/events` & `GET /api/student/events/recent`
- **Auth**: `role: student`
- **Success**: Chronological stream of student's observable events (supports `?limit=N`)

### 17. `GET /api/student/evidence`
- **Auth**: `role: student`
- **Success**: Array of derived, traceable evidence records for the student

### 18. `GET /api/student/signals` *(and `GET /api/student/signals/:dimension`)*
- **Auth**: `role: student`
- **Success**: Deterministic development signals across the 5 dimensions (`self_reliance`, `perseverance`, `problem_solving`, `initiative`, `sustained_engagement`).
- **Safety Rule**: `isCharacterVerdict: false` is strictly guaranteed on all signal outputs.

### 19. `GET /api/student/insight`
- **Auth**: `role: student`
- **Success**: Latest qualitative insight grounded in observable evidence records

### 20. `GET /api/teacher/students`
- **Auth**: `role: teacher`
- **Success**: List of student summaries scoped to the teacher's assigned class cohort
- **Errors**: `403 FORBIDDEN` if caller is a student

### 21. `GET /api/teacher/students/:studentId`
- **Auth**: `role: teacher`
- **Scoping**: Teacher can only access students in their assigned cohort. Cross-cohort access returns `403 FORBIDDEN`.
- **Success**: In-depth student overview (profile, signals, evidence, recent events)
- **Errors**: `403 FORBIDDEN`, `404 STUDENT_NOT_FOUND`

### 22. `GET /api/teacher/students/:studentId/evidence`
- **Auth**: `role: teacher`
- **Scoping**: Returns `403 FORBIDDEN` if student is in another class cohort
- **Success**: Student's derived evidence records

### 23. `GET /api/teacher/activities`
- **Auth**: `role: teacher`
- **Success**: List of curriculum tasks

### 24. `POST /api/teacher/activities`
- **Auth**: `role: teacher`
- **Request**: `{ "title": "...", "subject": "...", "description": "..." }`
- **Response**: `201 Created`

### 25. `GET /api/teacher/events`
- **Auth**: `role: teacher`
- **Success**: Class-wide observable events stream (supports `?limit=N`)

### 26. `GET /api/teacher/signals`
- **Auth**: `role: teacher`
- **Success**: Development signals for all students in teacher's class cohort

### 27. `GET /api/teacher/group-signals`
- **Auth**: `role: teacher`
- **Success**: Qualitative class-level development summary per dimension without psychological verdicts

### 28. `GET /api/teacher/evidence`
- **Auth**: `role: teacher`
- **Success**: Class-wide evidence records

### 29. `POST /api/teacher/observations`
- **Auth**: `role: teacher`
- **Scoping**: Returns `403 FORBIDDEN` if target student is outside teacher's class cohort
- **Request**: `{ "studentId": "...", "text": "...", "dimension": "...", "taskId": "..." }`
- **Response**: `201 Created`
- **Events**: Records `teacher_observation` event, triggers evidence pipeline (e.g. `IN-01` initiative)

### 30. `GET /api/teacher/observations`
- **Auth**: `role: teacher`
- **Success**: List of teacher observations (supports `?studentId=...`)

### 31. `GET /api/teacher/attention-notes`
- **Auth**: `role: teacher`
- **Success**: Contextual attention notes (`insufficient-evidence`, `repeated-difficulty`, `observation-needed`, `inactive-work`)

---

## Frontend Integration Notes (Member 2)

1. Connect frontend services (`frontend/src/services/*.ts`) to point to `http://localhost:3001/api`.
2. In student views, send header `Authorization: Bearer student-maya` (or other student ID from the roster).
3. In teacher views, send header `Authorization: Bearer prof-teacher-1`.
4. When requesting hints in `mentorService.ts`:
   - Send `POST /api/hint` with body: `{ "taskId": taskId }`.
   - Do NOT pass any level or hintLevel parameter.
5. All response payloads wrap data in `{ "data": ... }` and errors in `{ "error": { "code", "message" } }`.
