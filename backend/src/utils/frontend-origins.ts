import { env } from "../config/env";

const LOCAL_FRONTEND_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
};

export const buildTrustedFrontendOrigins = () => {
  const origins = new Set<string>([normalizeOrigin(env.FRONTEND_URL)]);

  if (process.env.NODE_ENV !== "production") {
    for (const origin of LOCAL_FRONTEND_ORIGINS) {
      origins.add(normalizeOrigin(origin));
    }
  }

  return [...origins];
};

export const resolveTrustedFrontendOrigin = (requestOrigin?: string | null) => {
  const fallbackOrigin = normalizeOrigin(env.FRONTEND_URL);

  if (!requestOrigin) {
    return fallbackOrigin;
  }

  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  const allowedOrigins = new Set(buildTrustedFrontendOrigins());

  return allowedOrigins.has(normalizedRequestOrigin)
    ? normalizedRequestOrigin
    : fallbackOrigin;
};
