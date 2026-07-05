# CodeVista - Product Requirements Document (PRD)

## 1. Project Overview
**CodeVista** is a browser-based interactive coding environment that bridges the gap between writing code and deeply understanding it. It pairs a high-performance sandboxed execution engine with AI-driven, structured code analysis. The platform allows users to write code, execute it securely, and receive step-by-step traces, pseudocode breakdowns, and session history—all within a seamless, persistent web interface.

## 2. Target Audience
- **Learners & Students:** Individuals grasping fundamental programming concepts, algorithms, and logic flow.
- **Educators:** Instructors who need a visual and traceable environment to demonstrate code execution.
- **Developers:** Software engineers testing snippets, debugging logic, or exploring new language features with intelligent AI assistance.

## 3. Core Features & Functional Requirements

### 3.1 Interactive Code Editor
- **Technology:** Monaco Editor integration.
- **Capabilities:** Syntax highlighting, auto-completion, multi-language support, and a responsive editing interface.

### 3.2 Sandboxed Execution Engine
- **Primary Engine:** Judge0 integration for compiling and executing code.
- **Fallback Engine:** Piston integration to ensure high availability.
- **Security:** Fully sandboxed execution to prevent malicious operations.

### 3.3 AI-Driven Analysis & Traceability
- **Pseudocode Generation:** Deterministic transformation of code logic into understandable pseudocode.
- **Execution Tracing:** Step-by-step trace explanations of how variables and control structures mutate.
- **Providers:** Groq (primary for fast inference) and Gemini (fallback).

### 3.4 Session History & Persistence
- **History Tracking:** Automatic saving of every execution run per user.
- **Searchability:** Users can navigate and search past code executions and outputs.

### 3.5 Authentication & User Management
- **Provider:** Supabase Auth.
- **Methods:** Support for Email/Password and passwordless Magic Links.

### 3.6 Visualization
- **Logic Flowcharts:** Utilizing React Flow to visualize code logic and AI traces interactively.

## 4. Architecture & Technical Stack

The project follows a Monorepo architecture with a strict separation of concerns.

### 4.1 Frontend
- **Framework:** Next.js 15 (App Router, server-component-first paradigm).
- **Libraries:** React 19, Tailwind CSS for styling, Framer Motion for micro-animations, React Flow for visualizations.
- **State/UI:** Browser-driven interactions ensuring smooth client-side updates.

### 4.2 Backend
- **Framework:** Node.js 18+ with Express 5.
- **Language:** TypeScript.
- **Design Pattern:** Controller → Service → Integration pattern.
- **Logging:** Structured logging provided by a shared logger utility.

### 4.3 Database & Storage
- **Database:** Supabase PostgreSQL.
- **Access:** Utilizing `pg` and `@supabase/supabase-js`.
- **Security:** Service keys are restricted strictly to server-side usage.

## 5. System Routing

### 5.1 Client-side Routes (Frontend)
| Route Scope | Paths |
|-------------|-------|
| **Public** | `/`, `/about`, `/contact` |
| **Auth** | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` |
| **Application** | `/editor`, `/editor/insights`, `/history`, `/settings` |
| **Preview** | `/temp-redesign/*` |

### 5.2 API Routes (Backend)
- **`/api/execution`**: Code running and compilation.
- **`/api/analysis` & `/api/chat`**: AI tracing and pseudocode generation.
- **`/api/auth` & `/api/session`**: User session and workspace management.
- **`/api/history` & `/api/workspace`**: Retrieving past runs and saving snippets.

## 6. Environment & Infrastructure Requirements
The application relies on distinct `.env` files for both frontend and backend containing:
- API URLs (`FRONTEND_URL`, `NEXT_PUBLIC_API_URL`).
- Supabase connection details (`SUPABASE_URL`, `DATABASE_URL`, Anon/Service keys).
- Execution Engine URLs (`JUDGE0_BASE_URL`, `PISTON_BASE_URL`).
- AI Keys (`GROQ_API_KEY`, `GEMINI_API_KEY`).

## 7. Open Questions & Future Scope
- **Scalability of Execution Nodes:** Monitoring and horizontally scaling Judge0/Piston instances as concurrent user loads increase.
- **AI Token Optimization:** Implementing aggressive caching for frequent code snippets to minimize Groq/Gemini API costs.
- **Collaborative Sessions:** Future roadmaps may include real-time multi-user editing (similar to Google Docs or VSCode Live Share).
- **Language Expansion:** Ensuring deterministic trace behavior across heavily asynchronous languages like JavaScript or Rust.
