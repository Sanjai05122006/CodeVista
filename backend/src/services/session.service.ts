import { db, supabaseAdmin } from "../config/db";
import { AppError } from "../middleware/error.middleware";

/* =========================
   TYPES
========================= */

type ExecutionInput = {
  code: string;
  language: string;
  output?: string;
  error?: string;
  runtime?: number;
  memory?: number;
  ai?: {
    pseudocode?: string[];
    explanation?: string;
    complexity?: {
      time?: {
        best?: string;
        average?: string;
        worst?: string;
      };
      space?: string;
    };
    trace?: unknown[];
    algorithmSteps?: string[];
  };
};

type SaveSessionInput = {
  sessionId?: string;
  title?: string;
  executions: ExecutionInput[];
};

type SessionRecord = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ExecutionRecord = {
  id: string;
  session_id: string;
  code: string;
  language: string;
  created_at?: string;
  updated_at?: string;
};

type ExecutionResultRecord = {
  execution_id: string;
  stdout: string | null;
  stderr: string | null;
  runtime_ms: number | null;
  memory_kb: number | null;
};

type AIOutputRecord = {
  execution_id: string;
  pseudocode: string | null;
  algorithm_steps: string[] | null;
  time_complexity:
    | {
        best?: string;
        average?: string;
        worst?: string;
      }
    | null;
  space_complexity: string | null;
  explanation: string | null;
  execution_trace: unknown[] | null;
};

/* =========================
   HELPERS
========================= */

const validateExecutions = (payload: SaveSessionInput) => {
  if (!payload.executions || payload.executions.length === 0) {
    throw new AppError("INVALID_REQUEST_BODY", 400, "NO_EXECUTIONS_PROVIDED");
  }

  return payload.executions;
};

/* =========================
   SAVE SESSION
========================= */

export const saveSession = async (
  userId: string,
  payload: SaveSessionInput
) => {
  const executions = validateExecutions(payload);
  let sessionId: string = crypto.randomUUID();

  if (payload.sessionId) {
    const { data: existingSession, error: existingSessionError } =
      await supabaseAdmin
        .from("sessions")
        .select("id, user_id")
        .eq("id", payload.sessionId)
        .single();

    if (existingSessionError || !existingSession) {
      throw new AppError("SESSION_NOT_FOUND", 404, "SESSION_NOT_FOUND");
    }

    if (existingSession.user_id !== userId) {
      throw new AppError("FORBIDDEN", 403, "SESSION_ACCESS_DENIED");
    }

    sessionId = payload.sessionId;
  }

  const sessionPayload = {
    id: sessionId,
    user_id: userId,
    title: payload.title ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: sessionError } = payload.sessionId
    ? await supabaseAdmin
        .from("sessions")
        .update(sessionPayload)
        .eq("id", sessionId)
        .eq("user_id", userId)
    : await supabaseAdmin.from("sessions").insert(sessionPayload);

  if (sessionError) {
    throw new AppError(
      "SESSION_UPSERT_FAILED",
      500,
      `SESSION_UPSERT_FAILED: ${sessionError.message}`
    );
  }

  // CLEAR OLD DATA (idempotent behavior)
  await supabaseAdmin
    .from("executions")
    .delete()
    .eq("session_id", sessionId);

  // INSERT EXECUTIONS
  const executionRows = executions.map((exec) => ({
    session_id: sessionId,
    code: exec.code,
    language: exec.language,
  }));

  const { data: executionData, error: executionError } =
    await supabaseAdmin
      .from("executions")
      .insert(executionRows)
      .select();

  if (executionError || !executionData) {
    throw new AppError(
      "EXECUTION_INSERT_FAILED",
      500,
      `EXECUTION_INSERT_FAILED: ${executionError?.message}`
    );
  }

  // INSERT AI OUTPUTS + RESULTS
  for (let i = 0; i < executionData.length; i++) {
    const execRow = executionData[i];
    const input = executions[i];

    // AI OUTPUT
    if (input.ai) {
      await supabaseAdmin.from("ai_outputs").insert({
        execution_id: execRow.id,
        pseudocode: input.ai.pseudocode?.join("\n") ?? null,
        algorithm_steps: input.ai.algorithmSteps ?? null,
        time_complexity: input.ai.complexity?.time ?? null,
        space_complexity: input.ai.complexity?.space ?? null,
        explanation: input.ai.explanation ?? null,
        execution_trace: input.ai.trace ?? null,
      });
    }

    // EXECUTION RESULT
    await supabaseAdmin.from("execution_results").insert({
      execution_id: execRow.id,
      stdout: input.output ?? null,
      stderr: input.error ?? null,
      runtime_ms: input.runtime ?? null,
      memory_kb: input.memory ?? null,
    });
  }

  return sessionId;
};

/* =========================
   HISTORY
========================= */

export const getSessionHistory = async (
  userId: string,
  { limit = 20, offset = 0 }
) => {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`HISTORY_FETCH_FAILED: ${error.message}`);
  }

  const sessions = data ?? [];

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);
  const { data: executions, error: executionsError } = await supabaseAdmin
    .from("executions")
    .select("id, session_id, language, created_at")
    .in("session_id", sessionIds);

  if (executionsError) {
    throw new Error(`HISTORY_EXECUTIONS_FETCH_FAILED: ${executionsError.message}`);
  }

  const executionMap = new Map<
    string,
    { language: string | null; execution_count: number; created_at: string | null }
  >();

  for (const execution of executions ?? []) {
    const existing = executionMap.get(execution.session_id);

    if (!existing) {
      executionMap.set(execution.session_id, {
        language: execution.language ?? null,
        execution_count: 1,
        created_at: execution.created_at ?? null,
      });
      continue;
    }

    existing.execution_count += 1;

    const existingCreatedAt = existing.created_at ?? "";
    const nextCreatedAt = execution.created_at ?? "";
    if (nextCreatedAt > existingCreatedAt) {
      existing.language = execution.language ?? existing.language;
      existing.created_at = execution.created_at ?? existing.created_at;
    }
  }

  return sessions.map((session) => {
    const executionMeta = executionMap.get(session.id);

    return {
      ...session,
      language: executionMeta?.language ?? null,
      execution_count: executionMeta?.execution_count ?? 0,
    };
  });
};

/* =========================
   DETAIL
========================= */

export const getSessionDetail = async (
  userId: string,
  sessionId: string
) => {
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    throw new AppError("SESSION_NOT_FOUND", 404, "SESSION_NOT_FOUND");
  }

  const { data: executions, error: executionsError } = await supabaseAdmin
    .from("executions")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (executionsError) {
    throw new AppError(
      "SESSION_DETAIL_FAILED",
      500,
      `EXECUTIONS_FETCH_FAILED: ${executionsError.message}`
    );
  }

  const typedExecutions = (executions ?? []) as ExecutionRecord[];
  const executionIds = typedExecutions.map((execution) => execution.id);

  const [{ data: executionResults, error: executionResultsError }, { data: aiOutputs, error: aiOutputsError }] =
    executionIds.length > 0
      ? await Promise.all([
          supabaseAdmin
            .from("execution_results")
            .select("*")
            .in("execution_id", executionIds),
          supabaseAdmin.from("ai_outputs").select("*").in("execution_id", executionIds),
        ])
      : [
          { data: [], error: null as null },
          { data: [], error: null as null },
        ];

  if (executionResultsError) {
    throw new AppError(
      "SESSION_DETAIL_FAILED",
      500,
      `EXECUTION_RESULTS_FETCH_FAILED: ${executionResultsError.message}`
    );
  }

  if (aiOutputsError) {
    throw new AppError(
      "SESSION_DETAIL_FAILED",
      500,
      `AI_OUTPUTS_FETCH_FAILED: ${aiOutputsError.message}`
    );
  }

  const executionResultsByExecutionId = new Map(
    ((executionResults ?? []) as ExecutionResultRecord[]).map((row) => [
      row.execution_id,
      row,
    ])
  );

  const aiOutputsByExecutionId = new Map(
    ((aiOutputs ?? []) as AIOutputRecord[]).map((row) => [row.execution_id, row])
  );

  const normalizedExecutions = typedExecutions.map((execution) => {
    const result = executionResultsByExecutionId.get(execution.id);
    const ai = aiOutputsByExecutionId.get(execution.id);

    return {
      id: execution.id,
      session_id: execution.session_id,
      code: execution.code,
      language: execution.language,
      created_at: execution.created_at ?? null,
      updated_at: execution.updated_at ?? null,
      output: {
        stdout: result?.stdout ?? "",
        stderr: result?.stderr ?? "",
        runtime_ms: result?.runtime_ms ?? 0,
        memory_kb: result?.memory_kb ?? 0,
      },
      analysis: ai
        ? {
            pseudocode: ai.pseudocode
              ? ai.pseudocode
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
              : [],
            algorithm_steps: Array.isArray(ai.algorithm_steps)
              ? ai.algorithm_steps
              : [],
            time_complexity: ai.time_complexity ?? {
              best: "",
              average: "",
              worst: "",
            },
            space_complexity: ai.space_complexity ?? "",
            explanation: ai.explanation ?? "",
            execution_trace: Array.isArray(ai.execution_trace)
              ? ai.execution_trace
              : [],
          }
        : null,
    };
  });

  const { rows: threadRows } = await db.query(
    `SELECT id, title, session_id, updated_at
     FROM chat_threads
     WHERE session_id = $1 AND user_id = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [sessionId, userId]
  );

  const activeThread = threadRows[0] ?? null;
  let chatMessages: Array<{
    id: string;
    thread_id: string;
    role: "user" | "assistant";
    content: string;
    sequence: number;
    provider: string | null;
    model: string | null;
    created_at: string;
    updated_at: string;
  }> = [];

  if (activeThread) {
    const { rows } = await db.query(
      `SELECT id,
              thread_id,
              role,
              content,
              sequence,
              provider,
              model,
              created_at,
              updated_at
       FROM chat_messages
       WHERE thread_id = $1
       ORDER BY sequence ASC`,
      [activeThread.id]
    );

    chatMessages = rows;
  }

  return {
    ...(session as SessionRecord),
    executions: normalizedExecutions,
    chat: activeThread
      ? {
          thread_id: activeThread.id,
          title: activeThread.title ?? null,
          session_id: activeThread.session_id ?? sessionId,
          updated_at: activeThread.updated_at ?? null,
          messages: chatMessages,
        }
      : null,
  };
};

/* =========================
   CHAT
========================= */

export const saveChatMessages = async (
  userId: string,
  payload: {
    sessionId: string;
    messages: { role: "user" | "assistant"; content: string }[];
  }
) => {
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("id", payload.sessionId)
    .eq("user_id", userId)
    .single();

  if (!session) {
    throw new AppError("SESSION_NOT_FOUND", 404, "SESSION_NOT_FOUND");
  }

  const rows = payload.messages.map((m) => ({
    session_id: payload.sessionId,
    role: m.role,
    content: m.content,
  }));

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .insert(rows)
    .select();

  if (error) {
    throw new AppError(
      "CHAT_SAVE_FAILED",
      500,
      `CHAT_SAVE_FAILED: ${error.message}`
    );
  }

  return data ?? [];
};

export const getChatMessages = async (
  userId: string,
  sessionId: string
) => {
  const { data: session } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (!session) {
    throw new AppError("SESSION_NOT_FOUND", 404, "SESSION_NOT_FOUND");
  }

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new AppError(
      "CHAT_FETCH_FAILED",
      500,
      `CHAT_FETCH_FAILED: ${error.message}`
    );
  }

  return data ?? [];
};
