import { Request, Response } from "express";
import { AppError } from "../middleware/error.middleware";
import {
  recordContactSubmissionLog,
  sendContactSubmissionMessage,
} from "../services/contact.service";

export const recordContactSubmissionHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await recordContactSubmissionLog(req.body, {
      requestOrigin: req.header("origin"),
      requestIp: req.ip,
    });

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    const code = error instanceof AppError ? error.code : "CONTACT_LOG_FAILED";
    const message =
      error instanceof Error
        ? error.message
        : "Unable to record contact submission log.";

    return res.status(status).json({
      error: code,
      message,
    });
  }
};

export const sendContactSubmissionHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await sendContactSubmissionMessage(req.body, {
      requestOrigin: req.header("origin"),
      requestIp: req.ip,
    });

    return res.status(200).json({
      ok: true,
      message: "Your message was sent successfully.",
      message_id: result.messageId,
      provider_status: result.providerStatus,
    });
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    const code = error instanceof AppError ? error.code : "CONTACT_SEND_FAILED";
    const message =
      error instanceof Error
        ? error.message
        : "Unable to send your message right now.";

    return res.status(status).json({
      error: code,
      message,
    });
  }
};
