# CodeVista

> **Code execution. Structured AI analysis. Step-by-step visualisation. All in one place.**

CodeVista is a developer intelligence platform built for students, interview candidates, and junior engineers who want to truly *understand* code — not just run it. Write code, execute it in a real sandbox, get deterministic AI-powered pseudocode and complexity analysis, watch it execute step by step inside the editor, and come back to the same session tomorrow.

No tab switching. No fragmented tools. One environment.

---

## The Problem

Understanding code at runtime is a different skill from writing it. A student trying to understand recursion today has to:

1. Write code in VS Code
2. Run it in a terminal or Replit
3. Ask ChatGPT for an explanation
4. Open Python Tutor to visualise it
5. Lose all context the next day

**CodeVista collapses all five steps into one.**

---

## What You Can Do

- Write and run code in a browser-based Monaco editor
- Execute against a real sandboxed environment with live runtime output
- Get structured AI analysis — pseudocode, algorithm breakdown, and Big-O complexity
- Watch your code execute step by step with variable state and call stack
- Ask follow-up questions in a contextual AI chat panel
- Revisit past sessions and replay execution traces

---

## Language Support

| Language   | Execution | AI Analysis | Execution Trace |
|------------|-----------|-------------|-----------------|
| Python     | ✅        | ✅          | Full            |
| JavaScript | ✅        | ✅          | Partial         |
| C++        | ✅        | ✅          | Full            |

---

## Tech Stack

**Frontend** — Next.js · TypeScript · Tailwind CSS · React Flow · Framer Motion

**Backend** — Node.js · Express · TypeScript · Redis

**Infrastructure** — Supabase (PostgreSQL + Auth) · Judge0 / Piston (code execution) · Groq / Gemini (AI layer)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
│                     Next.js Frontend                         │
│                                                              │
│  Monaco Editor   │   Visualiser   │   AI Chat Panel         │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP / REST
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Node.js + Express Backend                   │
│                                                              │
│  Execution Service → Judge0 (primary) / Piston (fallback)   │
│  AI Service        → Groq / Gemini fallback                  │
│  Chat Service      → Context-aware interaction               │
│  Cache Layer       → Redis                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
      Judge0 / Piston              Supabase PostgreSQL
```

---

## Repository Structure

```
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

## Local Setup

### Prerequisites

- Node.js v18+
- npm
- A [Supabase](https://supabase.com) project
- Judge0 and Piston endpoints
- Groq and Gemini API keys

### Clone

```bash
git clone https://github.com/Sanjai05122006/codevista.git
cd codevista
```

### Configure Environment Variables

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPPORT_EMAIL=sanjai05126@gmail.com
NEXT_PUBLIC_GITHUB_URL=https://github.com/Sanjai05122006
```

**Backend** — create `backend/.env`:

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

### Start the Backend

```bash
cd backend
npm install
npm run dev
```

### Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Design Decisions

**Deterministic AI output** — every analysis call uses temperature=0, JSON schema validation, and caching. The same code always produces the same pseudocode and complexity breakdown.

**Cache-first** — analysis results are cached by `SHA-256(code + language)` for 24 hours. Execution results for 1 hour. At scale, this is the single largest cost and latency lever.

**Fault-tolerant execution** — Judge0 is the primary runner. If it fails or times out, the system automatically falls back to Piston. No single point of failure.

**Stateless chat** — the chat service is fully stateless on the server. The frontend sends full conversation history with every request, keeping the backend horizontally scalable.

---

## Contributing

Contributions are welcome from developers interested in improving the platform, refining the developer experience, or expanding the feature set.

For significant changes, please open an issue first to discuss the proposed improvement before submitting a pull request.

---

## License

This project is intended for educational and developer tooling purposes.

*Built to simplify how developers understand code execution and runtime behaviour.*