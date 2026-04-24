import { db } from "../config/db";

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
    throw new Error("MESSAGES_REQUIRED");
  }

  return messages.map((message) => {
    if (
      !message ||
      typeof message !== "object" ||
      !("role" in message) ||
      !("content" in message)
    ) {
      throw new Error("INVALID_MESSAGE_PAYLOAD");
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
      throw new Error("INVALID_MESSAGE_PAYLOAD");
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("MESSAGE_CONTENT_REQUIRED");
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

const ensureChatThread = async ({
  threadId,
  sessionId,
  title,
  userId,
}: EnsureChatThreadInput) => {
  if (!threadId || typeof threadId !== "string") {
    throw new Error("THREAD_ID_REQUIRED");
  }

  await db.query(
    `INSERT INTO chat_threads (id, session_id, user_id, title)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE
     SET
       session_id = COALESCE(chat_threads.session_id, EXCLUDED.session_id),
       user_id = COALESCE(chat_threads.user_id, EXCLUDED.user_id),
       title = COALESCE(EXCLUDED.title, chat_threads.title),
       updated_at = now()`,
    [threadId, sessionId ?? null, userId ?? null, title ?? null]
  );
};

export const insertMessagesBatch = async (
  threadId: string | undefined,
  messages: unknown,
  threadMeta: Omit<EnsureChatThreadInput, "threadId">
) => {
  const normalizedMessages = normalizeMessages(messages);
  const effectiveThreadId = threadId ?? threadMeta.sessionId;

  if (!effectiveThreadId) {
    throw new Error("THREAD_ID_REQUIRED");
  }

  await ensureChatThread({ threadId: effectiveThreadId, ...threadMeta });

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

export const getChatMessages = async (threadId: string) => {
  if (!threadId || typeof threadId !== "string") {
    throw new Error("THREAD_ID_REQUIRED");
  }

  const { rows } = await db.query(
    `SELECT id, thread_id, role, content, sequence, provider, model, created_at, updated_at
     FROM chat_messages
     WHERE thread_id = $1
     ORDER BY sequence ASC`,
    [threadId]
  );

  return rows;
};
