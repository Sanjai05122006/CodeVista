import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface CustomError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the maximum allowed size.",
      timestamp: new Date().toISOString(),
    });
  }

  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  if (status >= 500) {
    logger.error("request.failed", {
      path: req.path,
      method: req.method,
      status,
      code,
      message: err.message,
    });
  } else {
    logger.warn("request.rejected", {
      path: req.path,
      method: req.method,
      status,
      code,
      message: err.message,
    });
  }

  return res.status(status).json({
    error: code,
    message: err.message,
    timestamp: new Date().toISOString(),
  });
};

export class AppError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}
