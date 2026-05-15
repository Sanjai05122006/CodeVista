import { Request, Response } from "express";
import {
  getSessionDetail,
  getSessionHistory,
  saveSession,
} from "../services/session.service";
import { AppError } from "../middleware/error.middleware";

export const saveSessionHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const sessionId = await saveSession(req.user.id, req.body);

    return res.status(200).json({ session_id: sessionId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save session.";
    const status = error instanceof AppError ? error.status : 400;
    const code = error instanceof AppError ? error.code : "SESSION_SAVE_FAILED";
    return res.status(status).json({ error: code, message });
  }
};

export const getSessionHistoryHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    const offset = Number.parseInt(String(req.query.offset ?? "0"), 10);

    const sessions = await getSessionHistory(req.user.id, {
      limit: Number.isNaN(limit) ? 20 : limit,
      offset: Number.isNaN(offset) ? 0 : offset,
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load history.";
    const status = error instanceof AppError ? error.status : 400;
    const code =
      error instanceof AppError ? error.code : "SESSION_HISTORY_FAILED";
    return res.status(status).json({ error: code, message });
  }
};

export const getSessionDetailHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const sessionId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const session = await getSessionDetail(req.user.id, sessionId);

    return res.status(200).json(session);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load session.";
    const status = error instanceof AppError ? error.status : 400;
    const code =
      error instanceof AppError ? error.code : "SESSION_DETAIL_FAILED";
    return res.status(status).json({ error: code, message });
  }
};
