# AI Integration

Owner: Member 1. All AI runs server-side (Gemini). The API key is never sent to the browser.
Every endpoint validates input with Zod (invalid input returns 400) and never fails because of the AI: on any Gemini problem it returns deterministic fallback content with HTTP 200 and `source: "fallback"`.

## Available APIs

### POST /api/ai/mentor

Generate a hint at a given level.

Request: `task` (string), `attempt` (string, optional), `hintLevel` (0-5), `dimension` (optional), `mentorReference` (optional `{title, source, excerpt}`, must be a verified reference from the application).

Response: `{ success: true, data: { hintLevel, response, nextStep?, mentorReference?, source, fallbackReason? } }`

> **Temporary route.** It currently trusts the `hintLevel` sent by the client. Do not call it directly from student-facing code. The production path is `requestHint()` (see below), behind student authentication.

### POST /api/ai/mission

Turn an academic task into a Growth Mission.

Request: `academicTask`, `subject`, `ageOrGrade`, `developmentDimension`.

Response: `{ success: true, mission: { title, challenge, focus, instructions[], reflection | null }, source }`

### POST /api/ai/reflection

Generate a contextual reflection question.

Request: `academicTask`, `developmentDimension`, `attemptSummary`, optional `outcome`, optional `ageOrGrade`.

Response: `{ success: true, reflection: { prompt, followUp | null }, source }`

`developmentDimension` is one of `self_reliance`, `perseverance`, `problem_solving`, `initiative`, `sustained_engagement`.

## Hint Ladder

| Level | Meaning |
|---|---|
| 0 | independent-thinking pushback (fixed text, no AI call) |
| 1 | reflective prompt |
| 2 | conceptual hint |
| 3 | structured guidance |
| 4 | worked example |
| 5 | direct solution |

The application/server determines the allowed hint level. Gemini does NOT determine it, and its output must match the schema for the selected level or a level-specific fallback is used.

Level rule (`nextHintLevel` in `lib/engines/hint-engine.ts`): 0 if no hint has been granted and the student has not described their attempt; otherwise one above the highest level already granted, capped at 5.

## Application flow (for Member 2 / 3)

`lib/ai/integration.ts`:

- `requestMission(req)`
- `requestHint(adapter, input)`: records `hint_requested`, picks the level, generates it, records `hint_level_granted`. Preferred hint path.
- `requestReflection(req)`: generates only; nothing is recorded.
- `recordReflectionSubmitted(adapter, ...)`: call when the student submits a reflection (stores length only).
- `recordStudentAction(adapter, ...)`: for `attempt`, `retry`, `completed`.

## Events

Expected app events: `attempt`, `hint_requested`, `hint_level_granted`, `retry`, `reflection`, `completed`.
Shape (provisional): `{ studentId, taskId, type, source: "app", metadata, createdAt }`.

Member 3 owns persistence. To connect it, implement `AIIntegrationAdapter`:

- `recordEvent(event)`
- `getGrantedHintLevels(studentId, taskId)`

The event shape is provisional: if Member 3's contract differs, it wins and `integration.ts` should be adjusted to it.

## Ownership

- Member 1: AI and AI integration.
- Member 2: Frontend.
- Member 3: Supabase, data, events, evidence, signals.
- Member 4: Product, content, Vivekananda corpus.

## Important Safety Rule

AI generates guidance and reflection. AI does NOT determine:

- character score
- development score
- evidence
- signal
- "good/bad character"
- psychological state

Missions and reflections are checked for scoring, labelling, self-rating and surveillance language (webcam, eye contact, attention scores). Vivekananda is only ever attributed through a verified `mentorReference` supplied by the application, and any other mention is replaced by the fallback.

## Fallback

If Gemini is unavailable (no key, rate limit, timeout, error) or its output is invalid or unsafe, deterministic fallback content is returned with `source: "fallback"`. Level 0 is always deterministic.

## Configuration

Server-side env vars: `GEMINI_API_KEY` (optional, enables live AI) and `GEMINI_MODEL` (optional, default `gemini-flash-latest`). See `.env.example`.
