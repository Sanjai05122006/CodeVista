import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/db";
import { logger } from "../utils/logger";

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authorizationHeader = req.header("Authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    if (!token) return next();

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      logger.warn("auth.optional_failed", {
        path: req.path,
        method: req.method,
      });
      return next();
    }

    if (data?.user) {
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
      };
    }

    return next();
  } catch (err: any) {
    logger.warn("auth.optional_error", {
      path: req.path,
      method: req.method,
      message: err instanceof Error ? err.message : "Unknown auth error",
    });
    return next(); // never block request
  }
};
