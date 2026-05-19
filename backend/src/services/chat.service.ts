import { supabaseAdmin } from "../config/db";
import { AppError } from "../middleware/error.middleware";

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
  provider?: string | null;
  model?: string | null;
  sequence?: number | null;
};

type EnsureChatThreadInput = {
  threadId?: string | null;
  sessionId?: string | null;
  title?: string | null;
  userId?: string | null;
};

const normalizeMessages = (messages: unknown): ChatMessageInput[] => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError("INVALID_REQUEST_BODY", 400, "MESSAGES_REQUIRED");
  }

  return messages.map((message) => {
    if (
      !message ||
      typeof message !== "object" ||
      !("role" in message) ||
      !("content" in message)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "INVALID_MESSAGE_PAYLOAD"
      );
    }

    const role = message.role;
    const content = message.content;
    const provider =
      "provider" in message && typeof message.provider === "string"
        ? message.provider
        : null;
    const model =
      "model" in message && typeof message.model === "string"
        ? message.model
        : null;

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "INVALID_MESSAGE_PAYLOAD"
      );
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "MESSAGE_CONTENT_REQUIRED"
      );
    }

    return {
      role,
      content: trimmedContent,
      provider,
      model,
      sequence:
        "sequence" in message && typeof message.sequence === "number"
          ? message.sequence
          : null,
    };
  });
};

const assertOwnedSession = async (userId: string, sessionId: string) => {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("SESSION_NOT_FOUND", 404, "SESSION_NOT_FOUND");
  }
};

const ensureChatThread = async ({
  threadId,
  sessionId,
  title,
  userId,
}: EnsureChatThreadInput) => {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401, "UNAUTHORIZED");
  }

  if (!threadId || typeof threadId !== "string") {
    throw new AppError("INVALID_REQUEST_BODY", 400, "THREAD_ID_REQUIRED");
  }

  if (sessionId) {
    await assertOwnedSession(userId, sessionId);
  }

  const { data: existingThread, error: threadLookupError } = await supabaseAdmin
    .from("chat_threads")
    .select("id, user_id, session_id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadLookupError) {
    throw new AppError(
      "CHAT_THREAD_LOOKUP_FAILED",
      500,
      `CHAT_THREAD_LOOKUP_FAILED: ${threadLookupError.message}`
    );
  }

  if (!existingThread) {
    const { error: insertError } = await supabaseAdmin.from("chat_threads").insert({
      id: threadId,
      session_id: sessionId ?? null,
      user_id: userId,
      title: title ?? null,
    });

    if (insertError) {
      throw new AppError(
        "CHAT_THREAD_CREATE_FAILED",
        500,
        `CHAT_THREAD_CREATE_FAILED: ${insertError.message}`
      );
    }
    return;
  }

  if (existingThread.user_id !== userId) {
    throw new AppError("FORBIDDEN", 403, "THREAD_ACCESS_DENIED");
  }

  const { error: updateError } = await supabaseAdmin
    .from("chat_threads")
    .update({
      session_id: existingThread.session_id ?? sessionId ?? null,
      title: title ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("user_id", userId);

  if (updateError) {
    throw new AppError(
      "CHAT_THREAD_UPDATE_FAILED",
      500,
      `CHAT_THREAD_UPDATE_FAILED: ${updateError.message}`
    );
  }
};

export const insertMessagesBatch = async (
  userId: string,
  threadId: string | undefined,
  messages: unknown,
  threadMeta: Omit<EnsureChatThreadInput, "threadId">
) => {
  const normalizedMessages = normalizeMessages(messages);
  const effectiveThreadId = threadId ?? threadMeta.sessionId;

  if (!effectiveThreadId) {
    throw new AppError("INVALID_REQUEST_BODY", 400, "THREAD_ID_REQUIRED");
  }

  await ensureChatThread({
    threadId: effectiveThreadId,
    ...threadMeta,
    userId,
  });

  const messageRows = normalizedMessages.map((msg, index) => ({
    thread_id: effectiveThreadId,
    role: msg.role,
    content: msg.content,
    sequence: msg.sequence ?? index + 1,
    provider: msg.provider ?? null,
    model: msg.model ?? null,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from("chat_messages")
    .upsert(messageRows, {
      onConflict: "thread_id,sequence",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    throw new AppError(
      "CHAT_MESSAGES_UPSERT_FAILED",
      500,
      `CHAT_MESSAGES_UPSERT_FAILED: ${upsertError.message}`
    );
  }
};

export const getChatMessages = async (userId: string, threadId: string) => {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401, "UNAUTHORIZED");
  }

  if (!threadId || typeof threadId !== "string") {
    throw new AppError("INVALID_REQUEST_BODY", 400, "THREAD_ID_REQUIRED");
  }

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("chat_threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (threadError) {
    throw new AppError(
      "CHAT_THREAD_LOOKUP_FAILED",
      500,
      `CHAT_THREAD_LOOKUP_FAILED: ${threadError.message}`
    );
  }

  if (!thread) {
    throw new AppError("THREAD_NOT_FOUND", 404, "THREAD_NOT_FOUND");
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("chat_messages")
    .select(
      "id, thread_id, role, content, sequence, provider, model, created_at, updated_at"
    )
    .eq("thread_id", threadId)
    .order("sequence", { ascending: true });

  if (messagesError) {
    throw new AppError(
      "CHAT_FETCH_FAILED",
      500,
      `CHAT_FETCH_FAILED: ${messagesError.message}`
    );
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  return messages;
};
