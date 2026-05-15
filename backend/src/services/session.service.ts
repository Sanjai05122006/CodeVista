import { supabaseAdmin } from "../config/db";
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
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`HISTORY_FETCH_FAILED: ${error.message}`);
  }

  return data ?? [];
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

  const { data: executions } = await supabaseAdmin
    .from("executions")
    .select("*")
    .eq("session_id", sessionId);

  return {
    ...session,
    executions: executions ?? [],
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
