<div align="center">

# CodeVista

**Write code. Run it. Understand it.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Educational-blue?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)]()

[Overview](#overview) · [Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Environment Variables](#environment-variables) · [Contributing](#contributing)


</div>

---

## Overview

CodeVista is a browser-based coding environment that pairs a sandboxed execution engine with structured AI analysis. Write code, run it, and get step-by-step traces, pseudocode breakdowns, and session history — all in one place. Authentication and persistence are handled through Supabase so your work is saved across sessions.

---

## Features

- **In-browser editor** powered by Monaco with syntax highlighting and multi-language support
- **Sandboxed execution** via Judge0 (primary) with Piston as a fallback
- **AI-driven analysis** — deterministic pseudocode and execution trace explanations via Groq (primary) and Gemini (fallback)
- **Session history** — every execution is saved and searchable per user
- **Auth** — email/password and magic link via Supabase Auth

---

## Architecture

CodeVista is a monorepo with a clear frontend/backend split.

```
CodeVista/
├── frontend/        # Next.js 15 App Router, React, Tailwind CSS
├── backend/         # Node.js, Express 5, TypeScript
└── README.md
```

**Frontend:** Next.js 15 (App Router, server-component-first), React, TypeScript, Tailwind CSS, Monaco Editor, Framer Motion, React Flow.

**Backend:** Node.js 18+, Express 5, TypeScript. Routes follow a controller → service → integration pattern. Structured logging is provided by a shared logger utility. Supabase service keys are server-side only.

**Data:** Supabase Postgres accessed via `pg` and `@supabase/supabase-js`.

**UI validation:** Agent Browser for browser-driven checks. Playwright is not part of the shipped stack.

### Routes

| Surface | Paths |
|---|---|
| Public | `/` `/about` `/contact` |
| Auth | `/login` `/register` `/forgot-password` `/reset-password` `/auth/callback` |
| App | `/editor` `/editor/insights` `/history` `/settings` |
| Preview | `/temp-redesign/*` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Judge0 and Piston instances (self-hosted or managed)
- Groq and Gemini API keys

### Install

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Run (development)

```bash
# Backend — runs on :5000
cd backend && npm run dev

# Frontend — runs on :3000
cd frontend && npm run dev
```

### Build and verify

```bash
# Backend
cd backend
npm run build
npm run test

# Frontend
cd frontend
npm run build
npm run lint
```

---

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

---

## Contributing

This is a personal project under active development. Issues and pull requests are welcome — please open an issue first to discuss significant changes.