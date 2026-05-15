type LogLevel = "info" | "warn" | "error";

const sanitizeMeta = (meta?: Record<string, unknown>) => {
  if (!meta) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined)
  );
};

const writeLog = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) => {
  const sanitizedMeta = sanitizeMeta(meta);
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(sanitizedMeta ? { meta: sanitizedMeta } : {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    writeLog("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    writeLog("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    writeLog("error", message, meta),
};
