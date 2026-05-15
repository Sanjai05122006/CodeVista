import { Request, Response } from "express";
import { generateChatReply } from "../services/ai.service";
import { getChatMessages, insertMessagesBatch } from "../services/chat.service";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export const chat = async (req: Request, res: Response) => {
  try {
    const { message, context, history } = req.body ?? {};
    const ai = await generateChatReply({ message, context, history });
    return res.status(200).json(ai);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate chat reply.";
    const status = message === "MESSAGE_REQUIRED" ? 400 : 502;
    return res.status(status).json({ error: message });
  }
};

export const saveBatch = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const { threadId, sessionId, title, messages } = req.body ?? {};
    await insertMessagesBatch(req.user.id, threadId ?? sessionId, messages, {
      sessionId,
      title,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    const code =
      error instanceof AppError ? error.code : "CHAT_BATCH_SAVE_FAILED";
    const message =
      error instanceof Error ? error.message : "Unable to save chat messages.";

    logger.warn("chat.batch_save_failed", {
      status,
      code,
      message,
    });

    return res.status(status).json({
      error: code,
      message,
    });
  }
};

export const getThreadMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const threadId = Array.isArray(req.params.threadId)
      ? req.params.threadId[0]
      : req.params.threadId;
    const messages = await getChatMessages(req.user.id, threadId);
    return res.status(200).json({ messages });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 400;
    const code = error instanceof AppError ? error.code : "CHAT_FETCH_FAILED";
    const message =
      error instanceof Error ? error.message : "Unable to load chat messages.";
    return res.status(status).json({ error: code, message });
  }
};
