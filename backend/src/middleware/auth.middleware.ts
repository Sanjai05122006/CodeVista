import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/db";
import { logger } from "../utils/logger";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "MISSING_AUTH_TOKEN" });
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({ error: "INVALID_AUTH_TOKEN" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.warn("auth.invalid_token", {
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({ error: "INVALID_AUTH_TOKEN" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };

    return next();
  } catch (error) {
    logger.error("auth.lookup_failed", {
      path: req.path,
      method: req.method,
      message: error instanceof Error ? error.message : "Unknown auth error",
    });
    return res.status(401).json({ error: "INVALID_AUTH_TOKEN" });
  }
};

export const requireAuthenticatedAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    return res.status(401).json({
      error: "AUTH_REQUIRED",
      message: "Sign in is required to access this endpoint.",
    });
  }

  return next();
};
