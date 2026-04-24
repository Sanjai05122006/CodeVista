import { Request, Response } from "express";
import { generateChatReply } from "../services/ai.service";
import { getChatMessages, insertMessagesBatch } from "../services/chat.service";

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
    const { threadId, sessionId, title, messages } = req.body ?? {};
    await insertMessagesBatch(threadId ?? sessionId, messages, {
      sessionId,
      title,
      userId: req.user?.id ?? null,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save chat messages.";
    console.error("[BATCH SAVE FAILED]", message);
    return res.status(200).json({ success: false });
  }
};

export const getThreadMessages = async (req: Request, res: Response) => {
  try {
    const threadId = Array.isArray(req.params.threadId)
      ? req.params.threadId[0]
      : req.params.threadId;
    const messages = await getChatMessages(threadId);
    return res.status(200).json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load chat messages.";
    return res.status(400).json({ error: message });
  }
};
