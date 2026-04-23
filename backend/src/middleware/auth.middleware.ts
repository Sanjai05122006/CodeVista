import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/db";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    return res.status(401).json({ error: "INVALID_AUTH_TOKEN" });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
  };

  return next();
};
