import { Request, Response, NextFunction } from "express";

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
  console.error(`[ERROR] ${err.message}`, err);
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
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