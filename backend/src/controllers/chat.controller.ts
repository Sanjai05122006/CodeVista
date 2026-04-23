import { Request, Response } from "express";
import {
  getChatMessages,
  saveChatMessages,
} from "../services/session.service";

export const saveChatMessageHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const messages = await saveChatMessages(req.user.id, req.body);
    return res.status(200).json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save chat messages.";
    const status = message === "SESSION_NOT_FOUND" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
};

export const getChatMessagesHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    const messages = await getChatMessages(req.user.id, sessionId);
    return res.status(200).json({ messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load chat messages.";
    const status = message === "SESSION_NOT_FOUND" ? 404 : 400;
    return res.status(status).json({ error: message });
  }
};
