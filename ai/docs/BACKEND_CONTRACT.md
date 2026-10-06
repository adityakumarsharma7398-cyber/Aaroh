# AI <-> Backend Contract (Phase 8A)

Written against the actual code on `origin/main` (`server/`, `shared/`). Companion to `AI_INTEGRATION.md`.
Classes: **A** compatible, **B** simple adapter mapping, **C** backend change required, **D** AI change required, **E** architectural conflict.

## What exists

- **Backend** (`server/`): Express + SQLite (libsql/Drizzle). Only HTTP route: `GET /api/health`. Events, evidence and signals are library functions (`events/logger.ts`, `engine/evidence.ts`, `engine/signals.ts`), not routes. **No authentication of any kind.**
- **Shared** (`shared/src/types`): `EVENT_TYPES` = attempt, hint_requested, hint_level_granted, retry, feedback_applied, completed, reflection, teacher_observation. `EVENT_SOURCES` = app, teacher, student. `RecordEventInput`, `ObservableEvent`, `Mission`, `AcademicTask`, `DevelopmentDimension`.
- **AI** (`ai/`, Next.js app, own `package.json`, not an npm workspace): `lib/ai/*`, `lib/engines/hint-engine.ts`, three routes under `/api/ai/*`.

## Comparison

| # | AI expected | Backend provides | Class | Resolution |
|---|---|---|---|---|
| 1 | Event types attempt, hint_requested, hint_level_granted, retry, reflection, completed | All present in `EVENT_TYPES` | A | AI types now derive from `shared/` (type-only import). |
| 2 | Event source always `"app"` | Seeds use `student` for hint_requested and reflection, `app` for the rest | B | `SOURCE_BY_TYPE` in `integration.ts` follows the backend convention. |
| 3 | Event shape `{studentId, taskId, type, source, metadata, createdAt}` | `RecordEventInput` (`taskId` and `createdAt` optional) | A | AI now sends `RecordEventInput` directly. |
| 4 | Granted levels via `getGrantedHintLevels` | No such function; `hint_level_granted` events carry `metadata.level` (number), which evidence rules read | B | AI derives levels from `getStudentTaskEvents()` (exists). `grantedLevelsFromEvents` ignores non-0..5 values and ignores `hint_requested.requestedLevel`. |
| 5 | Record events | `recordEvent(input)` returns `ObservableEvent`, throws on invalid input | A | Adapter wraps it best-effort. |
| 6 | Task text for hint generation | `tasks` table exists, **no read function** | C | See Backend requirements #2. |
| 7 | Mission `{title, challenge, focus, instructions[], reflection}` | `Mission` row: one `instruction` string + `dimensions[]`; **no create/read function** | B + C | `toBackendMissionDraft` flattens (lossy). Persistence: Backend requirements #3. |
| 8 | Reflection question `{prompt, followUp}` | Nothing stored; student answer is a `reflection` event with `metadata.note` | B | AI stores the student's text as `metadata.note` (+ `dimension`, `responseLength`). |
| 9 | Authenticated student identity | None | C | Backend requirement #1. |
| 10 | AI called by whom? | Backend has no way to call a Next app, and the Next app has no HTTP client for the backend | **E (open decision)** | See Blockers. |

## Hint ownership (verified)

The level is never read from the client on the trusted path:
`clientHintRequestSchema` accepts only `{taskId, attempt?, dimension?}` and is strict, so `hintLevel`, `level`, `requestedLevel` and `studentId` are rejected. `requestHintForTask` loads the task from the backend, reads this student's `hint_level_granted` events, picks the level with `nextHintLevel`, and records `hint_level_granted` with `metadata.level` (the field evidence rules read). Gemini output must match the schema for that level or a level-specific fallback is used.

`POST /api/ai/mentor` still trusts a client-supplied `hintLevel` and is therefore **disabled when `NODE_ENV=production`** (403) unless `AI_ALLOW_UNTRUSTED_MENTOR=true`. It remains available in development for testing.

## Backend requirements (Member 3), none implemented by Member 1

1. **Authentication / identity.** Provide the authenticated student id to the code that calls the AI functions (`studentId` must never come from a request body or a client-supplied header). Also authorise that the student may access `taskId`. Needed: a session or token check and a `getCurrentStudent(req) -> {id, role}`.
2. **`getTask(taskId)`** (`server/src/...`): read from `tasks`.
   Request: `taskId: string`. Response: `{id, title, subject, description} | null`. Reason: the client sends only a `taskId`; task text must not be client-supplied.
3. **Mission persistence** (create/read for `missions`), if AI missions are to be stored.
   Input from AI: `{taskId, studentId, instruction, dimensions[]}` (backend assigns `id`, `status`, `createdAt`). The mission's title, focus and reflection question are folded into `instruction`; add columns only if the UI needs them separately.
4. **HTTP surface** for the above (the backend only has `/api/health`), or a decision on #10 in Blockers.
5. **Event semantics to confirm** (no code change if agreed): AI emits `hint_requested` (source `student`, empty metadata), `hint_level_granted` (source `app`, metadata `{level, source: "gemini"|"fallback"}`), `reflection` (source `student`, metadata `{dimension, note, responseLength}`). The AI flow records `attempt`, `retry`, `completed` only when the app calls `recordStudentAction`, and for `completed` it passes whatever metadata the app gives, e.g. `{success: true}`. It never emits `teacher_observation` or `feedback_applied`.

## Frontend contract (Member 2). Proposed names, not final

Existing and working today (development only for mentor):
- `POST /api/ai/mission`: `{academicTask, subject, ageOrGrade, developmentDimension}` -> `{success, mission, source}`
- `POST /api/ai/reflection`: `{academicTask, developmentDimension, attemptSummary, outcome?, ageOrGrade?}` -> `{success, reflection, source}`

Proposed (does **not** exist yet; needs #1, #2 and #4):
- `POST /api/hint` with `{taskId, attempt?, dimension?}` -> the `MentorResponse` (`hintLevel`, `response`, `nextStep?`, `source`). No level, no student id in the body.

## Database requirements (list only, nothing migrated)

- Nothing new for hints or reflections: `events` already holds `hint_level_granted.metadata.level` and `reflection.metadata.note`.
- A `tasks` read path (#2) and a `missions` write path (#3).
- Optional: persisting AI mission fields (title, focus, reflection question) separately.

## Blockers

1. **No authentication** in the backend (#1), so a trusted hint route cannot exist yet.
2. **Open architecture decision (E):** the backend is Express/ESM with no AI access, and the AI is a separate Next app. Either (a) Express imports `ai/lib/ai/integration.ts` (needs the server `tsconfig` to allow `.ts` import extensions, and `ai/` dependencies installed or made a workspace) or (b) the Next app hosts the authenticated routes and calls the backend over HTTP (needs backend routes for events, history and tasks). Member 1 and Member 3 should decide together. The adapter interface works for either.
3. `getTask` and mission persistence do not exist (#2, #3).
4. No live Gemini test has been run (no key in the repo; `.env.example` stays empty).
