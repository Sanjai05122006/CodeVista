import { Request, Response } from "express";
import { AppError } from "../middleware/error.middleware";
import { sendPasswordResetEmail } from "../services/auth.service";

export const requestPasswordResetHandler = async (
  req: Request,
  res: Response
) => {
  try {
    await sendPasswordResetEmail(req.body.email, {
      requestOrigin: req.header("origin"),
    });

    return res.status(200).json({
      ok: true,
      message:
        "If that email is registered, a password reset link has been sent.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to send password reset email.";
    const status = error instanceof AppError ? error.status : 502;
    const code =
      error instanceof AppError
        ? error.code
        : "PASSWORD_RESET_REQUEST_FAILED";

    return res.status(status).json({ error: code, message });
  }
};
