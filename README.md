# CodeVista

CodeVista is an education-focused developer intelligence platform for students, interview candidates, and junior engineers. It combines code execution, structured AI analysis, step-by-step tracing, and saved sessions so users can understand code behavior without switching tools.

The current implementation is a two-app repo:
- `frontend/` - Next.js App Router frontend
- `backend/` - Express API service

## Current Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- UI / motion: Monaco Editor, Framer Motion, React Flow
- UI testing: Agent Browser for browser-driven UI checks
- Backend: Node.js, Express 5, TypeScript
- Validation: Zod
- Auth / DB: Supabase Auth and Supabase Postgres
- Execution: Judge0 primary, Piston fallback
- AI: Groq primary, Gemini fallback
- Data access: `pg` plus `@supabase/supabase-js`

## What the product does

- Write code in the browser
- Execute code in a sandboxed backend flow
- Generate deterministic analysis and pseudocode
- View execution traces and session history
- Sign in with Supabase Auth and keep personal work saved

## Current Surfaces

- Public pages: `/`, `/about`, `/contact`
- Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- App pages: `/editor`, `/editor/insights`, `/history`, `/settings`
- Preview-only redesign routes: `/temp-redesign/*`

## Repository Layout

```text
CodeVista/
├── frontend/
├── backend/
├── docs/
└── README.md
```

## Documentation Sources

- [AGENTS.md](./AGENTS.md) - repository operating rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) - layer map and system boundaries
- [REQUIREMENTS.md](./REQUIREMENTS.md) - dependency and compliance notes
- [docs/api/api.md](./docs/api/api.md) - API reference
- [docs/schema/schema.md](./docs/schema/schema.md) - database schema sync
- [docs/schema/pii-fields.md](./docs/schema/pii-fields.md) - PII register
- [docs/ui/design-system.md](./docs/ui/design-system.md) - frontend design system

## Local Setup

Install dependencies in both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Build and verify:

```bash
cd backend
npm run build
npm run test

cd ../frontend
npm run build
npm run lint
```

## Environment Variables

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPPORT_EMAIL=you@example.com
NEXT_PUBLIC_GITHUB_URL=https://github.com/your-handle
```

### `backend/.env`

```env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_postgres_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JUDGE0_BASE_URL=your_judge0_url
PISTON_BASE_URL=your_piston_url
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
PORT=5000
```

## Implementation Notes

- The frontend uses the App Router and should stay server-component-first.
- The backend uses Express routes, controllers, services, and integration helpers.
- Logging should use the structured logger utility already in the backend.
- Supabase service keys must stay server-side only.
- Browser-driven UI validation uses Agent Browser; Playwright is not part of the shipped frontend stack.
- The project is currently personal-session oriented, not org-scoped B2B/B2G.
