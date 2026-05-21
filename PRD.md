# CodeVista — Product Requirements Document (PRD)

> **Version:** 1.0  
> **Status:** Ready for Engineering  
> **Owner:** Product Manager  
> **Stack:** Next.js · Node.js/Express · Supabase · OpenAI · Judge0/Piston · React Flow · Framer Motion  
> **Deployment:** Vercel (frontend) · Railway/Render (backend) · Supabase (DB + Auth)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Target Users & Personas](#4-target-users--personas)
5. [Core Value Proposition](#5-core-value-proposition)
6. [Competitive Analysis](#6-competitive-analysis)
7. [Feature Requirements](#7-feature-requirements)
8. [High-Level System Design](#8-high-level-system-design)
9. [Data Flow Architecture](#9-data-flow-architecture)
10. [Module Breakdown](#10-module-breakdown)
11. [Database Schema](#11-database-schema)
12. [API Contract](#12-api-contract)
13. [AI Design Strategy](#13-ai-design-strategy)
14. [Execution System Design](#14-execution-system-design)
15. [Caching Strategy](#15-caching-strategy)
16. [Security & Safety](#16-security--safety)
17. [Scalability Plan](#17-scalability-plan)
18. [Phase-by-Phase Development Roadmap](#18-phase-by-phase-development-roadmap)
19. [Success Metrics](#19-success-metrics)
20. [Non-Goals](#20-non-goals)
21. [Trade-offs & Risks](#21-trade-offs--risks)
22. [Differentiation Strategy](#22-differentiation-strategy)

---

## 1. Executive Summary

CodeVista is a **developer intelligence platform** — not just a code runner, not just a chatbot. It is a unified environment where a developer writes code and immediately gets back:

- Structured **pseudocode** and algorithm explanation
- **Time and space complexity** analysis (Big-O)
- **Step-by-step execution visualisation** with variable state, call stack, and memory view — built directly into the editor (zero tab switching)
- A **context-aware AI chatbot** for deeper explanation
- **Persistent history** to track learning over time

The built-in visualiser is the core differentiator. The product removes the single biggest pain in developer learning: context switching between four separate tools to understand one piece of code.

---

## 2. Problem Statement

### The Root Pain

Developers — especially students, junior engineers, and interview candidates — can *write* code but cannot *introspect* it deeply. Understanding what code actually does at runtime is a fundamentally different skill from writing it.

### Existing Tools Are Fragmented

| Tool | What It Does | What It Misses |
|------|-------------|----------------|
| VS Code | Powerful editor | No built-in visualisation or AI analysis |
| Python Tutor | Great step-by-step visualisation | Separate tool, no AI, no history, Python only |
| Replit | Cloud IDE + run | No deep execution tracing or structured AI analysis |
| ChatGPT / Perplexity | AI explanation | No execution, no structure, no memory, inconsistent |
| LeetCode | Practice problems | No code explanation or execution visualisation |

### The Context-Switching Tax

A student trying to understand recursion today must:
1. Write code in VS Code
2. Run it in a terminal or Replit
3. Ask ChatGPT to explain it (get inconsistent prose)
4. Open Python Tutor to visualise it (only Python)
5. Lose all context the next day — no history saved

**CodeVista collapses all five steps into one.**

### Specific Struggles
- Beginners cannot visualise pointers, recursion, stack/heap behaviour, or async flow
- Students switch 3–5 tabs to understand a single algorithm
- ChatGPT answers vary every run — no determinism, no structure
- No product saves a user's "learning journey" with code history

---

## 3. Product Vision

> **"Not just code execution — code understanding."**

CodeVista turns raw code into structured understanding by combining:

1. **Real execution** (grounded in actual runtime, not AI hallucination)
2. **AI-powered structural analysis** (deterministic, schema-validated outputs)
3. **Built-in step-by-step visualisation** (no tab switching — editor and visualiser are one)
4. **Learning continuity** (history, sessions, revisit capability)

This is a **developer experience platform**, not a utility tool.

---

## 4. Target Users & Personas

### Persona 1 — The CS Student (Primary)
- **Who:** Undergraduate learning DSA, algorithms, or system concepts
- **Pain:** Cannot visualise recursion, pointer logic, or async flow. Switches between 4+ tools
- **Goal:** See *what happens* inside the code, step by step, with variables and call stack visible
- **CodeVista Value:** Built-in execution visualiser + AI explanation in one environment

### Persona 2 — The Interview Candidate
- **Who:** Developer preparing for technical interviews (FAANG / product companies)
- **Pain:** Must articulate algorithm design, complexity, and pseudocode under pressure
- **Goal:** Instant, structured complexity breakdown and pseudocode to study and internalise
- **CodeVista Value:** Auto-generated pseudocode + Big-O analysis + chatbot for drilling

### Persona 3 — The Junior Developer
- **Who:** 0–2 years experience, onboarding to new codebases
- **Pain:** Cannot estimate complexity or explain unfamiliar code clearly to senior engineers
- **Goal:** Fast, reliable algorithm summary and execution trace of code they did not write
- **CodeVista Value:** Complexity analysis + algorithm walkthrough in seconds

### Persona 4 — The Educator / TA
- **Who:** University instructor or teaching assistant
- **Pain:** Needs to demonstrate algorithm execution visually in class or office hours
- **Goal:** Live visualiser + shareable analysis session
- **CodeVista Value:** Visualisation engine + history/sessions for sharing and revisiting

---

## 5. Core Value Proposition

CodeVista is the **only platform** that:

1. **Runs code AND explains it** in the same environment — no switching tools
2. **Visualises execution** without leaving the editor (built-in, not a separate tab)
3. **Gives deterministic, structured AI output** — not random prose that varies per run
4. **Remembers your learning history** — sessions are saved, searchable, and revisitable
5. **Grounds AI analysis in real execution data** — not hallucinated traces

---

## 6. Competitive Analysis

| Feature | CodeVista | ChatGPT | Python Tutor | VS Code | Replit |
|---------|-----------|---------|--------------|---------|--------|
| Code execution | ✅ | ❌ | ✅ (Python only) | ✅ | ✅ |
| Built-in visualiser | ✅ | ❌ | ✅ | ❌ | ❌ |
| AI explanation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Complexity analysis | ✅ | ✅ (inconsistent) | ❌ | ❌ | ❌ |
| Deterministic output | ✅ | ❌ | N/A | N/A | N/A |
| Learning history | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-language | ✅ (Phase 2+) | ✅ | Limited | ✅ | ✅ |
| Context-aware chatbot | ✅ | ✅ | ❌ | ❌ | ❌ |
| Single unified environment | ✅ | ❌ | ❌ | ❌ | Partial |

---

## 7. Feature Requirements

### Phase 1 — Core Foundation (MVP)
**Goal:** A working, deployed product that proves the core analysis loop.

| Feature | Description | Priority |
|---------|-------------|----------|
| Monaco Code Editor | VS Code-grade in-browser editor with syntax highlighting | P0 |
| Language Selector | Choose between JavaScript, Python (more in Phase 5) | P0 |
| Run Code (Judge0) | Execute code, get stdout/stderr/runtime | P0 |
| Pseudocode Generation | AI generates structured, readable pseudocode | P0 |
| Algorithm Explanation | AI explains the algorithm in numbered steps | P0 |
| Time Complexity | Big-O output (best / average / worst case) | P0 |
| Space Complexity | Memory footprint analysis | P0 |
| Console Output Panel | Display execution result, errors, runtime | P0 |
| Variable State Panel | Show variables and their values at execution | P0 |
| Auth (Supabase) | Email/password + Google OAuth sign up and login | P0 |

### Phase 2 — Intelligence Layer
**Goal:** Richer AI experience with context awareness.

| Feature | Description | Priority |
|---------|-------------|----------|
| Context-Aware Chatbot | AI knows your code + analysis; answer follow-up questions | P1 |
| Explanation Refinement | Ask follow-up questions about specific lines or complexity | P1 |
| Line-by-line Execution Highlight | Highlight currently executing line in editor | P1 |
| Call Stack Visualisation | Show function call depth and frames | P1 |
| Return Flow | Show what each function returns at each step | P1 |

### Phase 3 — Visualisation Engine (Core Differentiator)
**Goal:** The built-in execution visualiser — what makes CodeVista unmissable.

| Feature | Description | Priority |
|---------|-------------|----------|
| Step-by-step Execution Player | Play / Pause / Step Forward / Step Back controls | P1 |
| Data Flow Animation | Animated variable and data transitions using Framer Motion | P1 |
| Recursion Tree | Visual tree for recursive function calls | P1 |
| Array Visualisation | Arrays rendered as animated bars or boxes | P2 |
| Tree / Graph Visualisation | Node-edge graphs for data structure problems | P2 |
| Time-Travel Debugging | Navigate backward through execution history | P2 |
| React Flow Integration | Render execution graph as interactive flow diagram | P1 |

### Phase 4 — Persistence & History
**Goal:** Learning continuity — users return to CodeVista because their history is here.

| Feature | Description | Priority |
|---------|-------------|----------|
| Session Auto-Save | Every analysis auto-saved to Supabase after completion | P1 |
| History Dashboard | View all past sessions with timestamps and algorithm names | P1 |
| Revisit Session | Re-open any session and replay the visualisation | P1 |
| Chat History | All chat messages saved per session | P1 |
| Code Snippets Library | Save favourite snippets for quick access | P2 |

### Phase 5 — Advanced & Future
**Goal:** Production scalability and power-user features.

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-language Support | Python, JavaScript, C++, Java via Judge0 | P2 |
| Docker Execution Fallback | Self-hosted execution for reliability | P3 |
| DFS / BFS Algorithm Tracing | Algorithm-specific custom visualisation | P2 |
| Shareable Session Links | Share a session link publicly | P2 |
| Export Analysis | Export pseudocode + complexity to PDF or Markdown | P3 |
| Performance Heatmap | Highlight computationally expensive lines | P3 |

---

## 8. High-Level System Design

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                                  │
│                   Next.js Frontend  —  Vercel                            │
│                                                                          │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐  │
│  │  Monaco Editor   │  │  Visualiser        │  │  AI Chatbot Panel    │  │
│  │  (code input)    │  │  React Flow +      │  │  (context-aware)     │  │
│  │                  │  │  Framer Motion     │  │                      │  │
│  └────────┬─────────┘  └────────┬──────────┘  └──────────┬───────────┘  │
│           │                     │                         │              │
└───────────┼─────────────────────┼─────────────────────────┼──────────────┘
            │    HTTP / REST       │                         │
            ▼                     ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│               Node.js + Express Backend  —  Railway / Render             │
│                                                                          │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐  │
│  │ Execution        │  │ AI Analysis       │  │ Chat Controller      │  │
│  │ Controller       │  │ Controller        │  │                      │  │
│  └────────┬─────────┘  └────────┬──────────┘  └──────────┬───────────┘  │
│           │                     │                         │              │
│  ┌────────▼─────────┐  ┌────────▼──────────┐  ┌──────────▼───────────┐  │
│  │ Execution        │  │ AI Service         │  │ Cache Service        │  │
│  │ Service          │  │ (Prompt Eng +      │  │ (Redis / in-memory)  │  │
│  │ (retry + fallback│  │  Schema Validation)│  │                      │  │
│  └────────┬─────────┘  └────────┬──────────┘  └──────────────────────┘  │
│           │                     │                                        │
│  ┌────────▼─────────┐  ┌────────▼──────────┐                            │
│  │ integrations/    │  │ integrations/      │                            │
│  │ judge0.ts        │  │ openai.ts          │                            │
│  │ piston.ts        │  │                    │                            │
│  └────────┬─────────┘  └────────┬──────────┘                            │
│           │        Auth Middleware on all routes                         │
│           │        Rate Limit Middleware on all routes                   │
│           │        Error Middleware (global handler)                     │
└───────────┼─────────────────────┼──────────────────────────────────────-┘
            │                     │
            ▼                     ▼
┌─────────────────────┐  ┌──────────────────────────┐
│  Code Execution     │  │  AI Layer                 │
│  Judge0 API         │  │  OpenAI API (GPT-4o)      │
│  (primary)          │  │  Temperature = 0          │
│                     │  │  JSON schema output only  │
│  Fallback:          │  └──────────────────────────┘
│  Piston API         │
│  Future: Docker     │
└─────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  Supabase  —  PostgreSQL + Auth                          │
│         users · sessions · ai_outputs · execution_results · chat         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns** — frontend, backend, execution, and AI are fully decoupled layers
2. **Layered Architecture** — controllers → services → integrations. Business logic never bleeds into controllers
3. **Deterministic AI** — temperature=0, JSON schema output, validated on every call
4. **Cache-First** — identical code + language = cache hit, zero redundant API calls
5. **Fault Tolerance** — Judge0 → Piston fallback → Docker (Phase 5). No single point of failure
6. **Modular Integrations** — each external API (Judge0, Piston, OpenAI) lives in its own file, swappable independently
7. **Frontend/Backend Fully Separated** — deployed on different platforms, communicate via REST API with env-configured base URL

---

## 9. Data Flow Architecture

### Complete Request Lifecycle (Step by Step)

```
Step 1:  User writes code in Monaco Editor
         └── Selects language from dropdown (JavaScript / Python / C++)

Step 2:  User clicks "Analyse" button
         └── Frontend validates: non-empty code, language selected
         └── Spinner / loading state shown

Step 3:  Frontend fires two parallel requests:
         ├── POST /api/execution  { code, language }
         └── POST /api/analysis   { code, language }

Step 4:  Backend — Cache Check (both routes)
         └── Compute hash = SHA-256(code + language)
         ├── CACHE HIT  → return cached result immediately (< 200ms)
         └── CACHE MISS → proceed to external API calls

Step 5:  Execution Service
         └── Call Judge0 API (timeout: 5s, limits: 5s CPU, 128MB RAM)
         ├── SUCCESS → { stdout, stderr, exit_code, runtime_ms, memory_kb }
         └── FAILURE → retry once → fallback to Piston → error 503

Step 6:  AI Analysis Service (runs in parallel with Step 5)
         └── Build structured prompt (system + few-shot + user code)
         └── Call OpenAI API (temperature=0, JSON mode)
         └── Validate JSON response against schema
         ├── VALID   → extract { pseudocode, algorithm_steps, complexity }
         └── INVALID → single retry with correction prompt

Step 7:  Execution Tracer
         └── From execution result, produce step-by-step trace array
         └── Each step: { line_number, variables, call_stack, return_value }

Step 8:  Cache Store
         └── Write result to cache with SHA-256 key (TTL: analysis 24h, execution 1h)

Step 9:  Unified Response to Frontend
         {
           execution: { stdout, stderr, runtime_ms },
           analysis:  { pseudocode, algorithm_name, algorithm_steps, complexity },
           trace:     [ { line, variables, call_stack, return_value } ],
           session_id: "uuid"
         }

Step 10: Frontend Renders in Parallel
         ├── Console Output Panel  ← execution.stdout / stderr
         ├── Pseudocode Panel      ← analysis.pseudocode
         ├── Complexity Panel      ← analysis.complexity (best/avg/worst)
         └── Visualiser Engine     ← trace[] → React Flow + Framer Motion

Step 11: Session Auto-Save (if authenticated)
         └── POST to Supabase: session + ai_output + execution_result + trace
```

---

## 10. Module Breakdown

### Module 1 — Code Execution Service

**Responsibilities:** Run user-submitted code in a sandboxed environment, return output within a time limit.

**Inputs:** `{ code: string, language: string, stdin?: string }`

**Outputs:** `{ stdout: string, stderr: string, exit_code: number, runtime_ms: number, memory_kb: number }`

**Dependencies:** Judge0 API (primary), Piston API (fallback), Docker (Phase 5 fallback)

**Safety Limits:**
- Max execution time: 5 seconds (enforced by Judge0)
- Max memory: 128 MB
- No filesystem access inside sandbox
- No network access inside sandbox
- Infinite loops automatically killed at timeout

**Failure Strategy:**
- Call Judge0 → timeout after 5s or 5xx → retry once after 500ms → if still failing → call Piston API → if Piston fails → return `{ error: "EXECUTION_UNAVAILABLE", status: 503 }`

---

### Module 2 — AI Analysis Service

**Responsibilities:** Generate deterministic, structured pseudocode, algorithm breakdown, and complexity analysis from code.

**Inputs:** `{ code: string, language: string, execution_output?: string }`

**Outputs (JSON schema enforced):**
```json
{
  "pseudocode": "string (structured, line-by-line)",
  "algorithm_name": "string (e.g. Binary Search)",
  "algorithm_steps": ["Step 1: ...", "Step 2: ..."],
  "time_complexity": {
    "best":    "O(...)",
    "average": "O(...)",
    "worst":   "O(...)"
  },
  "space_complexity": "O(...)",
  "explanation": "string (plain English, 3–5 sentences)"
}
```

**Dependencies:** OpenAI API

**Determinism guarantee:** temperature=0 + JSON mode + schema validation + caching

---

### Module 3 — Execution Tracer

**Responsibilities:** Produce a machine-readable, step-by-step execution trace from code, consumable by the visualiser.

**How it works:**
- For JavaScript: Babel AST instrumentation — injects `__trace(line, vars, stack)` calls before every statement at build time
- For Python: Extended Judge0 output with `--trace` flag, or custom instrumentation layer
- Output is an ordered array of steps

**Step Format:**
```json
{
  "step": 1,
  "line_number": 4,
  "event_type": "assignment | call | return | loop_iteration | branch",
  "variables": { "a": 2, "b": 3, "result": null },
  "call_stack": ["main", "add"],
  "return_value": null
}
```

**Frontend consumption:** React Flow renders steps as nodes and edges. Framer Motion animates transitions. Play/Pause/Step controls navigate the array.

---

### Module 4 — Cache Layer

**Responsibilities:** Eliminate redundant API calls for identical code inputs.

**Cache key:** `SHA-256(code + language)` — deterministic, consistent

**Cache store:** Redis (production), in-memory Map (development/testing)

**TTL policy:**
- Analysis results: 24 hours (pseudocode and complexity don't change)
- Execution results: 1 hour (may vary by stdin, environment)

**Impact at scale:** At 1,000 users, the same algorithm (e.g. binary search, quicksort) will be submitted repeatedly. Cache hit rate target is 60%+, saving proportional OpenAI API cost and reducing p95 latency by 10x.

---

### Module 5 — Chatbot System

**Responsibilities:** Context-aware AI conversation scoped to the user's current code and analysis.

**Context injected into every chat request:**
```json
{
  "code": "current editor code",
  "pseudocode": "generated pseudocode",
  "complexity": "time and space analysis",
  "algorithm_name": "detected algorithm name"
}
```

**Architecture decision:** Stateless on the server. Full conversation history is sent by the frontend with each request. No server-side chat session management — simpler, horizontally scalable.

**Inputs:** `{ message: string, context: CodeContext, history: Message[] }`

**Outputs:** `{ reply: string }`

---

### Module 6 — Auth + History

**Responsibilities:** User authentication, session persistence, history dashboard.

**Auth provider:** Supabase Auth — email/password + Google OAuth. JWT token stored in client, passed in `Authorization: Bearer` header.

**Backend middleware:** `auth.middleware.ts` validates JWT on all protected routes (`/api/history`, `/api/chat` require auth; `/api/execution` and `/api/analysis` work unauthenticated but don't save sessions).

**What is saved per session (auto-save on analysis completion):**
- Code submitted
- Language
- AI outputs (full JSON)
- Execution result
- Execution trace (for re-playing visualisation)
- All chat messages
- Timestamp, duration

**History dashboard:** Lists all sessions by date, shows algorithm name and language. User can click any session to re-open it, replay the visualisation, and continue chatting.

---

## 11. Database Schema

```sql
-- Users (extended from Supabase Auth)
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (one per analysis run)
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,           -- auto-generated from algorithm_name
  language    TEXT NOT NULL,
  code        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AI Outputs (linked to session)
CREATE TABLE ai_outputs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID REFERENCES sessions(id) ON DELETE CASCADE,
  pseudocode       TEXT,
  algorithm_name   TEXT,
  algorithm_steps  JSONB,   -- string[]
  time_complexity  JSONB,   -- { best, average, worst }
  space_complexity TEXT,
  explanation      TEXT,
  execution_trace  JSONB,   -- TraceStep[]
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Execution Results
CREATE TABLE execution_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  stdout      TEXT,
  stderr      TEXT,
  exit_code   INTEGER,
  runtime_ms  INTEGER,
  memory_kb   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat History
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) — users only see their own data
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);
```

---

## 12. API Contract

### `POST /api/execution`
Run user code.

**Request body:**
```json
{ "code": "function add(a,b){ return a+b; } add(2,3);", "language": "javascript" }
```
**Success response:**
```json
{ "stdout": "5\n", "stderr": "", "exit_code": 0, "runtime_ms": 42, "memory_kb": 1024 }
```
**Error response:**
```json
{ "error": "EXECUTION_UNAVAILABLE", "message": "All execution providers failed" }
```

---

### `POST /api/analysis`
Generate AI analysis.

**Request body:**
```json
{ "code": "...", "language": "javascript", "execution_output": "5\n" }
```
**Success response:**
```json
{
  "pseudocode": "FUNCTION add(a, b)\n  RETURN a + b\nEND FUNCTION",
  "algorithm_name": "Basic Addition",
  "algorithm_steps": ["Accept two parameters a and b", "Return their sum"],
  "time_complexity": { "best": "O(1)", "average": "O(1)", "worst": "O(1)" },
  "space_complexity": "O(1)",
  "explanation": "This function performs a constant-time arithmetic operation."
}
```

---

### `POST /api/chat`
Context-aware chat message.

**Request body:**
```json
{
  "message": "Why is this O(n log n)?",
  "context": { "code": "...", "pseudocode": "...", "algorithm_name": "Merge Sort" },
  "history": [
    { "role": "user", "content": "What does this do?" },
    { "role": "assistant", "content": "This is merge sort..." }
  ]
}
```
**Response:**
```json
{ "reply": "Merge sort is O(n log n) because it divides the array into halves (log n levels) and merges n elements at each level..." }
```

---

### `GET /api/history`
List all sessions (auth required).

**Headers:** `Authorization: Bearer <jwt>`

**Response:**
```json
{
  "sessions": [
    { "id": "uuid", "title": "Merge Sort", "language": "javascript", "created_at": "2024-01-01T10:00:00Z" }
  ]
}
```

---

### `GET /api/history/:sessionId`
Get full session (auth required).

**Response:**
```json
{
  "session": { "id": "uuid", "code": "...", "language": "javascript" },
  "ai_output": { "pseudocode": "...", "complexity": "...", "trace": [...] },
  "execution": { "stdout": "...", "runtime_ms": 42 },
  "chat": [{ "role": "user", "content": "..." }]
}
```

---

## 13. AI Design Strategy

### The Core Problem with AI in Developer Tools

AI responses are non-deterministic by default. A developer tool cannot give different pseudocode for the same function on Monday vs Tuesday. Users lose trust immediately when outputs vary.

### CodeVista's Determinism Stack

1. **`temperature: 0`** on every OpenAI API call — removes randomness from token sampling
2. **`response_format: { type: "json_object" }`** — forces JSON-only output (OpenAI JSON mode)
3. **JSON schema validation** on every response — malformed output triggers a single corrective retry
4. **Caching** — after the first call, the same input always returns the exact same output (from cache)

### Prompt Architecture (Three Layers)

```
LAYER 1 — SYSTEM PROMPT (fixed, never changes):
  "You are a code analysis engine. Return ONLY a valid JSON object with
   these exact fields: pseudocode, algorithm_name, algorithm_steps,
   time_complexity (best/average/worst), space_complexity, explanation.
   No text outside the JSON. No markdown code blocks. No preamble."

LAYER 2 — FEW-SHOT EXAMPLES (2 examples in prompt):
  Example 1: Simple loop → correct JSON output
  Example 2: Recursive function → correct JSON output
  (Anchors the model's output format)

LAYER 3 — USER INPUT (dynamic per request):
  "Language: javascript
   Code: [user code here]
   Execution output: [stdout from Judge0, if available]
   Analyse this and return the JSON."
```

### Validation and Retry Flow

```
AI response received
        │
        ▼
JSON.parse() succeeds?
        ├── NO  → retry once: "Your response was not valid JSON. Return only the JSON object."
        └── YES
              │
              ▼
        All required fields present and correctly typed?
              ├── NO  → retry once with corrective prompt listing missing fields
              └── YES → store in cache → return to client
```

### Why Few-Shot Examples Matter

Without examples, the model may return pseudocode that looks like Python, or include "here is the analysis:" text before the JSON. Two well-chosen examples eliminate 95%+ of format deviations at temperature=0.

---

## 14. Execution System Design

### Primary: Judge0 API

- Hosted, managed code execution sandbox
- Supports 60+ programming languages
- Input: code + language ID + stdin + time limit + memory limit
- Output: stdout, stderr, exit code, compile output, execution time, memory usage
- Hard limits enforced: 5 seconds CPU time, 128 MB RAM per submission
- Infinite loops and memory bombs automatically killed

### Fallback: Piston API

- Open-source execution engine (self-hostable or free tier available)
- Same input/output contract, wrapped in `integrations/piston.ts` adapter
- Used automatically when Judge0 returns 5xx or does not respond within 5 seconds

### Future: Docker Sandbox (Phase 5)

- Each code submission runs in a fresh Docker container with resource limits
- Eliminates all external API dependency and associated costs
- Full control over language versions and execution environment
- Enables custom execution tracing instrumentation per language

### Failure Handling Flow

```
User submits code
       │
       ▼
Judge0 API call
├── SUCCESS (200, result available)   → return result → cache → respond
└── FAILURE (5xx, timeout >5s)
          │
          ▼
       Wait 500ms → retry Judge0
       ├── SUCCESS → return result → cache → respond
       └── FAILURE
                 │
                 ▼
          Piston API call (fallback)
          ├── SUCCESS → return result (log degraded mode) → respond
          └── FAILURE → return HTTP 503 { error: "EXECUTION_UNAVAILABLE" }
                         frontend shows: "Execution unavailable. Try again shortly."
```

---

## 15. Caching Strategy

| Cache Type | Key | TTL | Store |
|-----------|-----|-----|-------|
| AI Analysis Result | `SHA-256(code + language)` | 24 hours | Redis (prod), Map (dev) |
| Execution Result | `SHA-256(code + language + stdin)` | 1 hour | Redis (prod), Map (dev) |
| Session Data | `session_id` | Permanent | Supabase PostgreSQL |
| Chat Context | Per request, in-memory | Request lifetime | None (stateless) |

**Cache hit rate target:** 60%+ at 1,000+ users. Popular algorithms (binary search, bubble sort, fibonacci) will be submitted by many users — all after the first will be cache hits.

**Cost impact:** Each cache hit on analysis = ~$0.01–$0.05 saved in OpenAI API cost. At 10,000 monthly users, caching is the single largest cost control lever.

---

## 16. Security & Safety

### Code Execution Safety

- All code runs inside Judge0/Piston sandboxes — completely isolated from host system
- No filesystem access inside sandbox
- No network access inside sandbox (cannot exfiltrate data or call external services from user code)
- CPU time limit: 5 seconds enforced — infinite loops are automatically killed
- Memory limit: 128 MB enforced — memory bombs prevented
- Input validation: max code length 10,000 characters, max stdin 1,000 characters

### API Abuse Prevention

- Rate limiting middleware on all routes:
  - Unauthenticated: 20 requests/minute per IP
  - Authenticated: 60 requests/minute per user
- All external API keys (OpenAI, Judge0) stored server-side only — never sent to frontend
- Input sanitisation on all API endpoints (length limits, type validation)

### Auth & Data Security

- JWT tokens validated on every protected route via Supabase Auth middleware
- Row Level Security (RLS) enabled in Supabase — users can only query their own data
- CORS configured to allow only the frontend domain (set in `.env`)
- No sensitive data in client-side state or `localStorage`
- `.env.example` provided with placeholder values — real keys never committed

---

## 17. Scalability Plan

### 0 → 100 Users (MVP Phase)
- Single backend instance on Railway free tier
- In-memory Map cache (no Redis needed yet)
- Supabase free tier (sufficient for initial scale)
- No queue system — synchronous request handling

### 100 → 1,000 Users
- Add Redis for persistent, shared cache across potential multiple backend instances
- Enable rate limiting middleware (important — Judge0 and OpenAI have API rate limits)
- Monitor Judge0 API usage — upgrade plan if submission limits approached
- Backend horizontally scalable on Railway with auto-scaling enabled

### 1,000 → 10,000 Users
- Introduce job queue (BullMQ + Redis) for AI analysis requests — prevent OpenAI API flooding during traffic spikes
- Separate execution service and analysis service into independent Express apps (scale independently)
- CDN for frontend static assets (Vercel handles this automatically)
- Supabase connection pooler enabled (prevents PostgreSQL connection exhaustion)
- Cache hit rate at this scale absorbs majority of AI API load

### 10,000+ Users (Future Architecture)
- Self-hosted Docker execution replaces Judge0 (cost control + reliability)
- WebSockets for real-time execution streaming (instead of polling)
- Horizontal backend scaling behind load balancer
- OpenAI batch API for asynchronous, non-real-time analysis jobs
- CDN caching of common analysis results (public, non-user-specific)

---

## 18. Phase-by-Phase Development Roadmap

### Phase 1 — Foundation: Weeks 1–3
**Goal:** Deployed, working product. Core analysis loop functional end-to-end.

**Week 1 — Project Setup & Infrastructure**
- Create repo with `/frontend` and `/backend` folder structure
- Set up Next.js frontend (App Router, TypeScript, Tailwind)
- Set up Node.js + Express backend (TypeScript, src/ folder structure)
- Create Supabase project, define all tables, enable RLS
- Set up `.env` files (frontend `.env.local`, backend `.env`)
- Deploy frontend to Vercel (empty shell)
- Deploy backend to Railway (health check endpoint working)
- Confirm frontend can call backend across deployment environments (CORS configured)
- **Milestone:** Both services deployed, talking to each other, no routing errors

**Week 2 — Execution Layer**
- Integrate Monaco Editor in frontend (code input, language selector, run button)
- Implement `POST /api/execution` endpoint in backend
- Integrate Judge0 API in `integrations/judge0.ts`
- Build Execution Service with retry logic
- Console Output panel in frontend showing stdout/stderr/runtime
- Variable State panel (static for now, populated in Phase 3)
- Error handling for execution failures with user-facing messages
- **Milestone:** User can write code, run it, see output. Deployed and shareable.

**Week 3 — AI Analysis Layer**
- Integrate OpenAI API in `integrations/openai.ts`
- Build AI Service with prompt engineering, JSON schema validation, retry logic
- Implement `POST /api/analysis` endpoint
- In-memory cache layer (hash-based, Map object)
- Pseudocode Panel in frontend
- Complexity Panel in frontend (best / average / worst case Big-O)
- Algorithm explanation display
- **Milestone:** User can write code → see pseudocode + complexity. Deployed.

---

### Phase 2 — Auth & History: Week 4
**Goal:** User accounts, session persistence, history dashboard.

**Week 4 — Auth + Persistence**
- Supabase Auth integration in frontend (sign up, login, Google OAuth)
- JWT middleware in backend (`auth.middleware.ts`)
- Session auto-save after every successful analysis (POST to Supabase)
- `GET /api/history` and `GET /api/history/:id` endpoints
- History Dashboard page (list of past sessions with timestamps)
- Session Revisit page (re-open code + analysis from history)
- **Milestone:** Authenticated users have full persistent history. Sessions fully retrievable.

---

### Phase 3 — Chatbot: Week 5
**Goal:** Context-aware AI chatbot scoped to current code and analysis.

**Week 5 — Chat System**
- Chat UI panel in frontend (collapsible sidebar, message thread)
- `POST /api/chat` endpoint with context injection (code + pseudocode + complexity)
- Conversation history passed per request (stateless server design)
- Chat messages auto-saved to `chat_messages` table per session
- Typing indicator, error state handling
- **Milestone:** User can ask "Why is this O(n log n)?" and receive a contextually accurate, grounded answer.

---

### Phase 4 — Visualisation Engine: Weeks 6–8
**Goal:** The built-in execution visualiser. The product's core differentiator.

**Week 6 — Execution Tracer**
- AST-based code instrumentation for JavaScript using Babel
- Trace output format: `{ step, line_number, event_type, variables, call_stack, return_value }`
- Tracer integrated into execution flow — trace returned alongside stdout in analysis response
- Trace stored in `ai_outputs.execution_trace` in Supabase

**Week 7 — React Flow Visualiser**
- React Flow setup and layout in frontend
- Render execution trace steps as animated flow nodes
- Variable State Panel updates per step
- Call Stack panel showing live function call depth
- Play / Pause / Step Forward controls

**Week 8 — Animation & Advanced Visualisation**
- Framer Motion transitions between execution steps
- Step Back (time-travel) control
- Recursion Tree visual for recursive algorithms
- Line highlight in Monaco Editor synced to current execution step
- **Milestone:** User can play through code execution step-by-step inside the editor. Variables animate. Call stack updates live.

---

### Phase 5 — Polish & Scale: Weeks 9–10
**Goal:** Production-grade quality, additional language support, performance hardening.

**Week 9 — Production Infrastructure**
- Redis cache integration (replace in-memory Map)
- Piston API fallback integration
- Multi-language support: Python, JavaScript, C++ via Judge0 language IDs
- Rate limiting middleware (IP + user-based)
- Full error handling audit across all flows
- Logging with Winston or Pino

**Week 10 — Advanced Features & UX Polish**
- Array and Tree data structure visualisation panels
- Shareable session links (public URL for any session)
- UI/UX polish pass (loading states, empty states, error states, mobile responsiveness)
- Performance profiling — identify and resolve p95 latency outliers
- Full end-to-end testing of all deployed flows
- **Milestone:** Production-ready, multi-language, with advanced visualisation. Resume-ready and publicly accessible.

---

### Phase 6 — Future Roadmap (Post-Launch)

| Feature | Why |
|---------|-----|
| Docker-based execution engine | Eliminate Judge0 cost dependency at scale |
| WebSocket real-time execution streaming | Better UX for step-by-step as it runs |
| Algorithm performance heatmap | Highlight expensive lines visually |
| Export session to PDF / Markdown | Study material generation |
| Collaborative sessions | Pair programming / teaching mode |
| BullMQ job queue for analysis | Handle burst traffic gracefully |
| Custom user themes | Editor personalisation |

---

## 19. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Analysis response time (cache miss) | < 5 seconds p95 | Backend request logging |
| Analysis response time (cache hit) | < 200ms p95 | Redis / cache layer logging |
| Cache hit rate at 1,000+ users | > 50% | Redis stats |
| Session save success rate | > 99% | Error tracking |
| User return rate (within 7 days) | > 40% | Supabase analytics |
| AI schema validation pass rate (1st attempt) | > 95% | Backend logging |
| Execution API success rate (including fallback) | > 98% | Health monitoring |
| Visualiser render time for 100-step trace | < 300ms | Frontend performance profiling |

---

## 20. Non-Goals

The following are explicitly out of scope for the initial build:

- Perfect algorithm detection for all possible code patterns (edge cases accepted)
- Full multi-language support from Day 1 — start with JavaScript, add more in Phase 5
- Advanced distributed execution infrastructure — Docker is a Phase 5+ concern
- Real-time collaborative editing (separate, complex feature)
- Mobile native app (responsive web first)
- Custom AI model training — OpenAI API is the AI layer
- Paid subscription or monetisation layer — product-market fit is the goal first
- Browser extension or IDE plugin

---

## 21. Trade-offs & Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| OpenAI API cost at scale | Medium | High | Aggressive caching (24h TTL), rate limiting, batch API in future |
| Judge0 rate limits hit | Medium | Medium | Piston fallback; upgrade Judge0 plan proactively |
| AI output inconsistency despite temperature=0 | Low | High | Schema validation + retry; few-shot examples anchor format |
| Execution trace accuracy for complex code | Medium | High | Thorough AST instrumentation testing with edge cases |
| Visualiser performance with large trace arrays (500+ steps) | Medium | Medium | Virtualise React Flow nodes; paginate trace playback |
| Supabase free tier limits exceeded | Low (MVP) | Medium | Monitor row count and bandwidth; upgrade plan proactively |
| CORS misconfiguration at deployment | High (common mistake) | Medium | Document exact env var setup; test cross-origin before launch |
| User data privacy concerns | Low | High | RLS on all tables; no third-party analytics on code content |

---

## 22. Differentiation Strategy

### The One-Sentence Pitch

> "CodeVista is the only tool that runs your code, explains it with structured AI analysis, visualises it step-by-step inside the editor, and saves your learning history — all in one place."

### Why Users Will Not Just Use ChatGPT

| Dimension | ChatGPT | CodeVista |
|-----------|---------|-----------|
| Output structure | Free-form prose, varies per run | JSON schema, deterministic, always same format |
| Execution grounding | Hallucinated traces | Real execution, real stdout/stderr/runtime |
| Visualisation | None | Built-in step-by-step player, React Flow |
| Context memory | No learning history | Sessions saved, searchable, revisitable |
| Developer UX | Chat interface only | Monaco editor, panels, flow diagram, complexity view |
| Complexity analysis | Inconsistent | Structured best/average/worst Big-O every time |
| Call stack | Cannot show | Live call stack panel during execution |

### Hackathon / Resume Pitch

> "We are building an interactive developer intelligence platform that visualises code execution in real time — reducing the cognitive gap between writing code and truly understanding it. Unlike ChatGPT, our outputs are deterministic and grounded in real execution. Unlike Python Tutor, we support multiple languages and include AI explanation, complexity analysis, and learning history — inside a single editor environment."

---

*End of PRD — Version 1.0*