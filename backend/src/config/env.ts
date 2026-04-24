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

export const env = {
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  DATABASE_URL: getEnv("DATABASE_URL"),
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getOptionalEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  GROQ_API_KEY: getOptionalEnv("GROQ_API_KEY"),
  JUDGE0_BASE_URL: getEnv("JUDGE0_BASE_URL"),
  PISTON_BASE_URL: getEnv("PISTON_BASE_URL"),
};
