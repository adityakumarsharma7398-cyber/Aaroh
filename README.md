# AAROH

A human-development layer on top of ordinary academic work. Students do the academic work they already do;
AAROH turns it into observable evidence, explainable development signals, and practical growth missions.

> **Principles:** evidence comes from observable actions. Development signals are deterministic and
> evidence-backed. AI gives guidance, missions and reflection prompts, and never judges character.
> There is no character score, no personality score, no ranking, no surveillance, and no XP, points,
> streaks or leaderboards.

## Repository layout

This is a monorepo of three independently runnable packages plus Member 3's workspace.
The three codebases were merged from separate histories and are **not yet wired to each other**
(see [Integration status](#integration-status)).

```
Aaroh/
├── frontend/   Member 2. AAROH web app (Vite + React 19 + TypeScript). Public site, student app, teacher app.
│               Self-contained package with its own lockfile. Runs entirely on a typed in-memory mock backend.
├── ai/         Member 1. Next.js 16 app exposing the AI API routes (Gemini, hint ladder, missions, reflections),
│               with deterministic fallbacks and tests. Self-contained package with its own lockfile.
├── server/     Member 3. Express + SQLite (libSQL) via Drizzle: events, evidence engine, signal engine, seeds.
├── shared/     Member 3. Shared TypeScript contracts for the workspace (events, signals, students, tasks).
├── client/     Member 3. Minimal placeholder Vite client (health check). Kept for now; may be obsolete.
├── package.json         Member 3's npm-workspaces root (shared, server, client) plus wrapper scripts.
├── package-lock.json    Lockfile for the root workspace.
└── .env.example         Environment variable names only.
```

`frontend/` and `ai/` are deliberately **not** npm workspaces. They are separate packages with their own
dependency trees (the Next.js app and the Vite app pin different React and tooling versions), and keeping
them isolated avoids breaking the backend workspace. Run package commands from the package folder or through
the root wrapper scripts below. Do not merge the `package.json` or lockfiles.

## Running things

Node 22 or newer is recommended (Member 1's tests use native TypeScript, and the Supabase client packages
require it). Install each package with `npm ci` inside its own folder (root, `frontend/`, `ai/`).

| Package | Command (from repo root) | Underlying script |
|---|---|---|
| Backend workspace | `npm run typecheck`, `npm run build` | shared + server + client |
| Database | `npm run db:generate`, `db:migrate`, `seed` | Drizzle |
| Verification | `npm run verify:events`, `verify:evidence`, `verify:signals`, `verify:seed` | server |
| Backend dev | `npm run dev:server` (port 3001) | `tsx watch` |
| Frontend | `npm run dev:frontend`, `typecheck:frontend`, `lint:frontend`, `build:frontend` | `frontend/` scripts |
| AI | `npm run dev:ai`, `lint:ai`, `build:ai`, `test:ai` | `ai/` scripts |

Ports: `frontend/` and `client/` both default to Vite's 5173. Run only one at a time, or pass
`-- --port 5174`. The AI app uses Next's 3000 and the server uses 3001.

Environment: only variable **names** are tracked, in `.env.example` (and `ai/.env.example`). Never commit
real values. The server reads `process.env` directly; the AI app reads `ai/.env.local`.

## Integration status

**Done:** the three branches are unified in one repository, each system is intact, and each one
installs, type-checks and passes its own checks. Lockfiles were synced so `npm ci` works.

**Not done:** the systems do not talk to each other yet.

- `frontend/` still uses its mock services. No page calls a real API.
- The AI routes have no authentication, and `POST /api/ai/mentor` still trusts a client-supplied
  `hintLevel`. Hint level must be chosen by the server from the student's granted-hint history.
- Member 3's `AIIntegrationAdapter` (`ai/lib/ai/integration.ts`: `recordEvent`, `getGrantedHintLevels`) has no
  implementation backed by the event store.
- There is no authentication or teacher/student authorization on `server/`.

**Decisions needed before wiring (see the integration report):**

- **Database.** `server/` uses SQLite (libSQL) via Drizzle. `ai/` includes Supabase auth/client plumbing and
  the team's plan referred to Supabase. One persistence and auth story has to be chosen.
- **Vocabulary mapping.** Member 1 and 3 share event names (`attempt`, `hint_requested`, `hint_level_granted`,
  `retry`, `reflection`, `completed`, ...) and dimension names (`self_reliance`, `problem_solving`, ...).
  The frontend uses UI forms (`attempt-created`, `self-reliance`, ...). Map at the frontend service boundary;
  do not rewrite either side.
- **Request routing.** The frontend will need data from the Express server and AI from the Next app, so a
  single origin or proxy strategy is needed.
- **`client/` vs `frontend/`.** `client/` is a placeholder; decide later whether it can be removed.
- **UI ownership.** `ai/app/page.tsx` is a Phase 0 placeholder that itself says Member 2 owns the production UI;
  the product UI lives in `frontend/`. Decide whether `ai/` should stay API-only.
