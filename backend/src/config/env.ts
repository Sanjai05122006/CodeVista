import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const getEnv = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`${name} is not defined in .env`);
  }

  return value;
};

const getOptionalEnv = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
};

const getBooleanEnv = (name: string, fallback: boolean) => {
  const value = process.env[name];

  if (value == null || value === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`${name} must be a boolean value.`);
};

const DEFAULT_FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://codevista-dev.vercel.app"
    : "http://localhost:3000";

export const env = {
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL,
  DATABASE_URL: getEnv("DATABASE_URL"),
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getOptionalEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  GROQ_API_KEY: getOptionalEnv("GROQ_API_KEY"),
  JUDGE0_BASE_URL: getEnv("JUDGE0_BASE_URL"),
  PISTON_BASE_URL: getEnv("PISTON_BASE_URL"),
  PG_SSL_REJECT_UNAUTHORIZED: getBooleanEnv(
    "PG_SSL_REJECT_UNAUTHORIZED",
    true
  ),
  ALLOW_UNSAFE_JS_TRACING: getBooleanEnv("ALLOW_UNSAFE_JS_TRACING", false),
  ALLOW_ANONYMOUS_EXECUTION: getBooleanEnv(
    "ALLOW_ANONYMOUS_EXECUTION",
    false
  ),
  ALLOW_ANONYMOUS_ANALYSIS: getBooleanEnv(
    "ALLOW_ANONYMOUS_ANALYSIS",
    false
  ),
  ALLOW_ANONYMOUS_WORKSPACE: getBooleanEnv(
    "ALLOW_ANONYMOUS_WORKSPACE",
    false
  ),
  ALLOW_ANONYMOUS_CHAT: getBooleanEnv("ALLOW_ANONYMOUS_CHAT", false),
};
