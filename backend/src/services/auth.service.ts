import { db, supabaseAdmin } from "../config/db";
import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

const PASSWORD_RESET_REDIRECT_PATH = "/reset-password";

const findUserByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await db.query<{ id: string }>(
    "select id from auth.users where lower(email) = $1 limit 1",
    [normalizedEmail]
  );

  return result.rows[0] ?? null;
};

export const sendPasswordResetEmail = async (email: string) => {
  const account = await findUserByEmail(email);

  if (!account) {
    throw new AppError(
      "PASSWORD_RESET_USER_NOT_FOUND",
      404,
      "No account was found with that email address."
    );
  }

  const redirectTo = `${env.FRONTEND_URL.replace(/\/+$/, "")}${PASSWORD_RESET_REDIRECT_PATH}`;

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    logger.warn("auth.password_reset.request_failed", {
      email,
      message: error.message,
      status: error.status,
    });

    throw new AppError(
      "PASSWORD_RESET_REQUEST_FAILED",
      error.status && error.status >= 400 && error.status < 500 ? error.status : 502,
      "Unable to send password reset email right now."
    );
  }

  logger.info("auth.password_reset.requested", {
    email,
    redirect_to: redirectTo,
  });
};
