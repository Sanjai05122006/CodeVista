import type { AuthError, Session } from "@supabase/supabase-js";
import { clearStoredChatState } from "@/hooks/useLocalChat";
import { supabase } from "./supabaseClient";

const INVALID_REFRESH_TOKEN_MESSAGES = [
  "invalid refresh token",
  "refresh token not found",
];

export function isInvalidRefreshTokenError(error: AuthError | null) {
  if (!error?.message) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();

  return INVALID_REFRESH_TOKEN_MESSAGES.some((message) =>
    normalizedMessage.includes(message)
  );
}

export async function getSessionSafely() {
  const { data, error } = await supabase.auth.getSession();

  if (isInvalidRefreshTokenError(error)) {
    await supabase.auth.signOut({ scope: "local" });
    clearStoredChatState();

    return {
      session: null as Session | null,
      recoveredFromInvalidRefreshToken: true,
    };
  }

  return {
    session: data.session,
    recoveredFromInvalidRefreshToken: false,
  };
}
