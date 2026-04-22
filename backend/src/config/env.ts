import dotenv from "dotenv";

dotenv.config();

const getEnv = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`${name} is not defined in .env`);
  }

  return value;
};

export const env = {
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  JUDGE0_BASE_URL: getEnv("JUDGE0_BASE_URL"),
  PISTON_BASE_URL: getEnv("PISTON_BASE_URL"),
};
