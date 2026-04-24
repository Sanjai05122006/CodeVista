/* import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/db";

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.header("Authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    return next();
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (!error && data.user) {
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };
  }

  return next();
};
 */

import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/db";

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
      console.warn("[AUTH FAILED]", error.message);
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
    console.error("[AUTH ERROR]", err.message);
    return next(); // never block request
  }
};