<div align="center">

# CodeVista

**Code execution. Structured AI analysis. Step-by-step visualisation. All in one place.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Educational-blue?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)]()

[Overview](#overview) · [Features](#features) · [Language Support](#language-support) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Design Decisions](#design-decisions) · [Contributing](#contributing)

</div>

---

## Overview

CodeVista is a developer intelligence platform for students, interview candidates, and junior engineers who want to *understand* code — not just run it.

Today, understanding code at runtime requires five separate tools: an editor, a runner, an AI explainer, a visualiser, and something to save context between sessions. **CodeVista collapses all five into one environment.**

Write code, execute it in a real sandbox, receive deterministic AI-powered pseudocode and complexity analysis, watch it execute step by step with live variable state and call stack, ask follow-up questions in context, and return to the same session the next day.

---

## Features

- **Monaco editor** — browser-based editor with syntax highlighting and language support
- **Sandboxed execution** — runs real code against Judge0 (primary) with Piston fallback
- **Structured AI analysis** — deterministic pseudocode, algorithm breakdown, and Big-O complexity
- **Step-by-step visualiser** — execution trace with variable state and call stack at each step
- **Contextual AI chat** — follow-up questions grounded in the current code and execution context
- **Session persistence** — revisit past sessions and replay execution traces

---

## Language Support

| Language | Execution | AI Analysis | Execution Trace |
|---|---|---|---|
| Python | ✅ | ✅ | Full |
| JavaScript | ✅ | ✅ | Partial |
| C++ | ✅ | ✅ | Full |

---

## Tech Stack

**Frontend** — Next.js · TypeScript · Tailwind CSS · React Flow · Framer Motion

**Backend** — Node.js · Express · TypeScript · Redis

**Infrastructure** — Supabase (PostgreSQL + Auth) · Judge0 / Piston · Groq / Gemini

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                    Next.js Frontend                         │
│                                                             │
│   Monaco Editor  │  Step Visualiser  │  AI Chat Panel      │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP / REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js + Express Backend                   │
│                                                             │
│  Execution Service → Judge0 (primary) / Piston (fallback)  │
│  AI Service        → Groq / Gemini (fallback)              │
│  Chat Service      → stateless, context-aware              │
│  Cache Layer       → Redis (analysis + execution results)  │
└─────────────────────────────┬───────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        Judge0 / Piston             Supabase (PostgreSQL)
```

### Repository Structure

```
codevista/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
└── backend/
    └── src/
        ├── controllers/
        ├── services/
        ├── integrations/
        ├── routes/
        ├── middleware/
        └── config/
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project
- Judge0 and Piston endpoints (self-hosted or managed)
- Groq and Gemini API keys

### 1. Clone the repository

```bash
git clone https://github.com/Sanjai05122006/codevista.git
cd codevista
```

### 2. Configure environment variables

**Frontend** — `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** — `backend/.env`:

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

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Design Decisions

**Deterministic AI output** — every analysis request uses `temperature=0`, JSON schema validation, and a Redis cache keyed by `SHA-256(code + language)`. The same code always produces the same pseudocode and complexity breakdown. This eliminates drift and makes AI output reliable enough to display without human review.

**Cache-first** — analysis results are cached for 24 hours; execution results for 1 hour. At scale, repeated analysis of common patterns (sorting algorithms, recursion examples) is the single largest cost and latency lever.

**Fault-tolerant execution** — Judge0 is the primary runner. On failure or timeout, the system falls back to Piston automatically. No user-facing error on transient infrastructure issues.

**Stateless chat** — the chat service holds no server-side session state. The frontend sends full conversation history with every request, keeping the backend stateless and horizontally scalable without sticky sessions.

---

## Contributing

Contributions are welcome. For significant changes, open an issue first to discuss the proposed improvement before submitting a pull request. Bug fixes and documentation improvements can be submitted directly.

Please follow the existing code style and ensure any new API routes are covered by integration tests.

---

## License

This project is intended for educational and developer tooling purposes.

---

<div align="center">
<sub>Built to simplify how developers understand code execution and runtime behaviour.</sub>
</div>
