# CodeVista

> **Code execution. Structured AI analysis. Step-by-step visualisation. All in one place.**

CodeVista is a developer intelligence platform built for students, interview candidates, and junior engineers who want to truly understand code — not just run it. Write code, execute it against a real sandbox, get deterministic AI-powered pseudocode and complexity analysis, watch it execute step by step inside the editor, and come back to the same session tomorrow.

No tab switching. No fragmented tools. One environment.

---

# The Problem CodeVista Solves

Understanding code at runtime is a different skill from writing it. Today, a student trying to understand recursion has to:

1. Write code in VS Code
2. Run it in a terminal or Replit
3. Ask ChatGPT for an explanation
4. Open Python Tutor to visualise it
5. Lose all context the next day

**CodeVista collapses all five steps into one.**

---

# What You Can Do

* Write and run code from a browser-based Monaco editor
* Execute against a real sandboxed environment with runtime output
* Get structured AI analysis including pseudocode and complexity analysis
* Watch your code execute step by step with variable state and call stack
* Ask follow-up questions in a contextual chat panel
* Revisit past sessions and replay execution traces

---

# Tech Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React-Flow
* Framer Motion

## Backend

* Node.js
* Express
* TypeScript
* Redis

---

# System Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
│                     Next.js Frontend                         │
│                                                              │
│  Monaco Editor   │   Visualiser   │   AI Chat Panel         │
└──────────────────────────┬───────────────────────────────────┘
                           │
                    HTTP / REST
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Node.js + Express Backend                   │
│                                                              │
│  Execution Service → Judge0 / Piston                         │
│  AI Service        → Gemini / Groq                           │
│  Chat Service      → Context-aware interaction               │
│  Cache Layer       → Redis                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
      Judge0 / Piston              Supabase PostgreSQL
```

---

# Language Support

| Language   | Execution | Analysis | Execution Trace |
| ---------- | --------- | -------- | --------------- |
| Python     | Yes       | Yes      | Full            |
| JavaScript | Yes       | Yes      | Partial         |
| C++        | Yes       | Yes      | Full            |

---

# Repository Structure

```text
codevista/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── backend/
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── integrations/
│       ├── routes/
│       ├── middleware/
│       └── config/
│
└── .env.example
```

---

# Local Setup

## Prerequisites

* Node.js (v18+)
* npm
* A Supabase project
* Judge0 and Piston endpoints
* Gemini API key

---

# Clone and Configure

```bash
git clone https://github.com/Sanjai05122006/codevista.git
cd codevista
```

---

# Environment Variables

## Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPPORT_EMAIL=your_email
NEXT_PUBLIC_GITHUB_URL=your_link
```

Next.js accepts only `.env.local` for frontend environment variables.

---

## Backend (`backend/.env`)

```env
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_postgres_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JUDGE0_BASE_URL=your_judge0_url
PISTON_BASE_URL=your_piston_url
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_groq_key
PORT=5000
```

---

# Start Backend

```bash
cd backend
npm install
npm run dev
```

---

# Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Open the App

```text
http://localhost:3000
```

---

# Contributing


Contributions are welcome from developers interested in improving the platform, refining the developer experience, or expanding the feature set.

For significant changes, please open an issue first to discuss the proposed improvement before submitting a pull request.

---

# License
This project is intended for educational and developer tooling purposes.

*Built to simplify how developers understand code execution and runtime behaviour.*
