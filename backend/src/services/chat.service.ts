import { db } from "../config/db";
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
  const { rows } = await db.query(
    `SELECT id
     FROM sessions
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );

  if (rows.length === 0) {
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

  const { rows: threadRows } = await db.query(
    `SELECT id, user_id, session_id
     FROM chat_threads
     WHERE id = $1
     LIMIT 1`,
    [threadId]
  );

  if (threadRows.length === 0) {
    await db.query(
      `INSERT INTO chat_threads (id, session_id, user_id, title)
       VALUES ($1, $2, $3, $4)`,
      [threadId, sessionId ?? null, userId, title ?? null]
    );
    return;
  }

  const thread = threadRows[0];

  if (thread.user_id !== userId) {
    throw new AppError("FORBIDDEN", 403, "THREAD_ACCESS_DENIED");
  }

  await db.query(
    `UPDATE chat_threads
     SET
       session_id = COALESCE(chat_threads.session_id, $2),
       title = COALESCE($3, chat_threads.title),
       updated_at = now()
     WHERE id = $1 AND user_id = $4`,
    [threadId, sessionId ?? null, title ?? null, userId]
  );
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

  const values: Array<string | number | null> = [];
  const placeholders: string[] = [];

  normalizedMessages.forEach((msg, index) => {
    const base = index * 6;

    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    );

    values.push(
      effectiveThreadId,
      msg.role,
      msg.content,
      msg.sequence ?? index + 1,
      msg.provider ?? null,
      msg.model ?? null
    );
  });

  await db.query(
    `INSERT INTO chat_messages
     (thread_id, role, content, sequence, provider, model)
     VALUES ${placeholders.join(",")}
     ON CONFLICT (thread_id, sequence) DO NOTHING`,
    values
  );
};

export const getChatMessages = async (userId: string, threadId: string) => {
  if (!userId) {
    throw new AppError("UNAUTHORIZED", 401, "UNAUTHORIZED");
  }

  if (!threadId || typeof threadId !== "string") {
    throw new AppError("INVALID_REQUEST_BODY", 400, "THREAD_ID_REQUIRED");
  }

  const { rows } = await db.query(
    `SELECT message.id,
            message.thread_id,
            message.role,
            message.content,
            message.sequence,
            message.provider,
            message.model,
            message.created_at,
            message.updated_at
     FROM chat_messages AS message
     INNER JOIN chat_threads AS thread
       ON thread.id = message.thread_id
     WHERE message.thread_id = $1
       AND thread.user_id = $2
     ORDER BY message.sequence ASC`,
    [threadId, userId]
  );

  if (rows.length === 0) {
    const { rows: threadRows } = await db.query(
      `SELECT id
       FROM chat_threads
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [threadId, userId]
    );

    if (threadRows.length === 0) {
      throw new AppError("THREAD_NOT_FOUND", 404, "THREAD_NOT_FOUND");
    }
  }

  return rows;
};
