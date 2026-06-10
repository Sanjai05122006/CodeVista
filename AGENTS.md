# CodeVista — Codex Agent Context

## What This Project Is
CodeVista is an education-focused developer intelligence platform for students, interview candidates, and junior engineers. It combines code execution, structured AI analysis, step-by-step tracing, and session history so users can understand code behavior without switching tools.

This is a consumer-facing product with personal accounts and saved learning sessions. It is not currently a B2B or B2G multi-tenant platform.

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js App Router, React 19, TypeScript |
| UI / Motion | Tailwind CSS, Framer Motion, React Flow, Monaco Editor |
| UI Testing | Agent Browser npm package for automated browser-driven UI checks |
| Backend / API | Node.js, Express 5, TypeScript |
| Validation | Zod at API boundaries |
| Database | Supabase Postgres + `pg` + `@supabase/supabase-js` |
| Auth | Supabase Auth (email/password, Google OAuth, JWT) |
| Code Execution | Judge0 primary, Piston fallback |
| AI Providers | Groq primary, Gemini fallback |
| Logging | Structured JSON logger utility in `backend/src/utils/logger.ts` |
| Hosting | Vercel for frontend; separate Node host for backend |

---

## How to Run
Run each app from its own folder.

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Useful checks:

```bash
cd backend
npm run build
npm run test
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Agent Execution Mode
Auto mode, except these require explicit human approval before execution:
- Any file under `supabase/migrations/`
- Any `.env*` file
- Any `scripts/deploy*` file
- Any action that edits or renames an existing migration file

---

## Mandatory Agent Pipeline

Every task must run this pipeline in order. No skipping. No reordering.

00-agent-strategy -> 01-create-plan -> [write code]
-> 02-frontend-verify  (if any frontend-rendered UI, layout, styling, or app route changed)
-> 03-backend-verify   (if any Express/API/controller/service/integration file changed)
-> 04-database-verify  (if any Supabase/schema/seed/migration file changed; approval gate for migrations)
-> 11-ui-testing       (if any browser-visible frontend surface or temp-redesign preview changed)
-> 05-security-review  (every task, no exceptions)
-> 06-build-verify     (always; run the appropriate build/check commands for the repo)
-> 07-change-summary

If any step fails: stop and report the exact failure.

General rule:
- Do not stop after making the requested change.
- Always run every verification step that applies to the touched area(s).
- For redesigns, run browser-driven UI validation as part of the workflow.
- For backend or database work, include the corresponding verification and security checks before considering the task complete.

---

## Folder Ownership Rules

### Protected - explicit instruction required
```text
supabase/migrations/    permanent SQL migrations
.env*                   environment variables
scripts/deploy*         deployment scripts
docs/decisions/         append-only ADRs
```

### Sync pairs - change one, update the other
```text
API route changes     -> docs/api/api.md
Schema/table changes  -> docs/schema/schema.md
PII column changes    -> docs/schema/pii-fields.md
UI pattern changes    -> docs/ui/design-system.md
New npm package       -> REQUIREMENTS.md
```

---

## Existing Pattern Rule

Before changing any implementation:
1. Read the current implementation.
2. Identify the existing pattern.
3. Extend the pattern.
4. Do not replace working architecture unless explicitly requested.

Never invent:
- auth flows
- callback URLs
- route structures
- middleware patterns
- data access shapes

Follow the project conventions that already exist in the codebase.

---

## Current Architecture

Browser
  -> Next.js frontend (App Router)
  -> Express backend API
  -> Middleware
  -> Controllers
  -> Services
  -> Integrations / data access helpers
  -> Supabase / Judge0 / Piston / AI providers

- Frontend pages and components own the UX.
- Express routes should stay thin and delegate to controllers.
- Middleware handles request validation and auth checks before controllers run.
- Controllers coordinate the service call using already-validated input.
- Services hold business logic and error shaping.
- Database and external provider access stays out of routes and controllers.

The current backend codebase is service-centric and does not yet have a dedicated repository folder. If you introduce one, keep all Supabase queries there for that feature slice.

---

## TypeScript Rules
- strict mode, no `any`, no `@ts-ignore`
- Branded types for IDs where practical
- Zod schema at every API boundary
- Keep request validation near the route or controller that uses it
- Prefer consistent structured errors over ad hoc string throws

## Next.js Rules
- App Router only
- Server Components by default; use Client Components only when needed
- Data fetch in Server Components or route handlers where practical
- `next/image` for images, `next/font` for fonts
- Absolute imports via `@/` alias

## Express / Node.js Rules
- Use the structured logger utility; do not add new `console.log` calls in feature code
- Never log request bodies or secrets
- Validate all inputs before business logic runs
- Keep synchronous blocking out of request paths

## Supabase Rules
- Keep tenant-style isolation at the user/session level unless a future feature explicitly adds organizations
- Policies should be written for any new table that stores user-owned data
- Views should use `security_invoker = true` when applicable
- Service role keys stay server-side only


- Server-side Supabase access stays in the backend layer; the frontend may use the browser client for auth/session handling only

## Security Rules
- Every protected route must verify Supabase auth
- Audit sensitive actions such as login, logout, password reset, session save, data export, and delete
- Check OWASP risks on every backend change
- Keep user-scoped data tied to the authenticated user, not to hard-coded assumptions

## Testing Rules
- Unit tests stay close to the code they cover
- Integration tests live in `tests/integration/` when added
- E2E tests live in `tests/e2e/` when added
- New backend route: happy path plus auth failure coverage
- Run `npm run test` before marking a task done

## UI Testing Rules
- Use the `agent-browser` npm package for automated browser-driven UI testing across all frontend surfaces in this repo
- Prefer Agent Browser for landing pages, auth flows, editor surfaces, homepage preview work, and regression checks
- Manual browser review is allowed and encouraged alongside Agent Browser when a human visual pass helps catch issues automation may miss
- If the user explicitly asks not to use Agent Browser, fall back to manual browser testing for that task and say so in the result
- Read `docs/ui/design-system.md` before running UI tests so assertions match the current visual language
- Use `frontend/temp-redesign/README.md` when testing or iterating on preview-only redesign work
- Treat browser screenshots and test artifacts as disposable unless they are explicitly promoted
- Store preview screenshots in `frontend/temp-redesign/images/` using zero-padded numbering, e.g. `0001-home.png`, `0002-home.png`
- For redesign work, compare each browser screenshot against the matching reference image in `frontend/temp-redesign/ref/` and keep iterating until the preview matches the reference for that page at the target viewport
- For redesign work, do not stop at a near match: keep iterating and recapturing screenshots until the preview matches the reference image exactly for that page at the target viewport
- Treat each browser capture as one iteration in a loop: compare it to the reference image, make the next adjustment, and repeat until the rendered page is an exact match
- Do not mark a redesign task as complete until the browser screenshot and the reference image match exactly at the target viewport
- Temporary screenshots inside `frontend/temp-redesign/images/` may be deleted or replaced during iteration without additional approval
- For mobile viewports, keep hero content text-first, reduce top spacing, keep primary actions full-width and touch-friendly, and collapse footer link groups so the page remains readable without horizontal scrolling

---

## Temporary UI Redesign Workspace

The temp redesign workspace is disposable and exists only for previewing UI changes before they are ported into production pages.

- `frontend/temp-redesign/` holds temporary redesign previews, reference images, and screenshot output.
- `frontend/app/temp-redesign/` holds preview routes only.
- `frontend/temp-redesign/ref/home.png` is the homepage reference image.
- `frontend/temp-redesign/ref/about.png` is the about-page reference image.
- `frontend/temp-redesign/ref/` contains the reference images to match.
- `frontend/temp-redesign/about-preview.tsx` and `frontend/app/temp-redesign/about-preview/` are the about-page preview assets.
- `frontend/temp-redesign/images/` stores numbered screenshots captured during browser testing.
- Use the reference image first, then generate browser screenshots, compare them, and iterate until the preview matches the reference image for the page being redesigned.
- Compare the generated screenshot and the reference image side by side, identify the visual differences, apply the next adjustment, and repeat until the page is an exact match
- If the screenshot does not match the reference image exactly, continue the redesign loop and re-capture until it does
- Keep a running iteration sequence for the page being redesigned so the workflow always moves from reference, to capture, to comparison, to adjustment, until the final screenshot matches exactly
- A redesign is not finished after a single generated screenshot; it is finished only after the exact reference match is achieved
- When preview copy is intended to replace production UI, write it as production-ready product language; do not leave placeholder, internal, or PRD-referential text in the visible screen
- On mobile screens, prefer stacked hero content, larger tap targets, and footer sections that collapse or stack cleanly instead of squeezing desktop columns into the viewport
- Name screenshots as `NNNN-page.png`, where `NNNN` is a zero-padded increasing number and `page` is the current page tag.
- Never wire temp-redesign files into production routes.
- Remove or replace temporary preview files once the final implementation is ported.
- Move approved design changes into the real page or component only after permission is given.

## Agent Browser UI Testing

Use the `agent-browser` npm package for automated browser-driven UI testing when working on landing, auth, or temp-redesign previews.

- Run the browser agent against temp-redesign previews first when matching reference images.
- Use the package for screenshot-based validation and interaction checks.
- Keep the automated UI test flow aligned with the existing preview image naming rules.
- Do not treat temp-redesign pages as production surfaces.
