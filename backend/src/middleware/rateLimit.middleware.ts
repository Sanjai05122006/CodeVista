import { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

type LimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  name: string;
  anonymousLimit: number;
  authenticatedLimit: number;
  windowMs: number;
};

type RequestLimitOptions = {
  field: string;
  maxLength: number;
  required?: boolean;
};

type ChatHistoryRole = "user" | "assistant";

type ChatHistoryMessage = {
  role: ChatHistoryRole;
  content: string;
};

const buckets = new Map<string, LimitBucket>();

const DEFAULT_CLEANUP_INTERVAL_MS = 60_000;
let nextCleanupAt = Date.now() + DEFAULT_CLEANUP_INTERVAL_MS;

export const MAX_JSON_BODY_SIZE = "64kb";
export const MAX_CODE_LENGTH = 20_000;
export const MAX_LANGUAGE_LENGTH = 32;
export const MAX_EMAIL_LENGTH = 320;
export const MAX_STDIN_LENGTH = 2_000;
export const MAX_CHAT_MESSAGE_LENGTH = 4_000;
export const MAX_CHAT_HISTORY_MESSAGES = 20;
export const MAX_CHAT_BATCH_MESSAGES = 50;
export const MAX_CHAT_TITLE_LENGTH = 120;
export const MAX_THREAD_ID_LENGTH = 128;
export const MAX_SESSION_ID_LENGTH = 128;
export const MAX_SESSION_TITLE_LENGTH = 120;
export const MAX_EXECUTIONS_PER_SESSION = 25;
export const MAX_OUTPUT_LENGTH = 8_000;
export const MAX_TRACE_ITEMS = 500;
export const MAX_ALGORITHM_STEPS = 50;
export const MAX_ALGORITHM_NAME_LENGTH = 120;

const safeTrim = (value: string) => value.trim();

const cleanupExpiredBuckets = (now: number) => {
  if (now < nextCleanupAt) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  nextCleanupAt = now + DEFAULT_CLEANUP_INTERVAL_MS;
};

export const getClientIp = (req: Request) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || req.ip || "unknown";
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};

const getRateLimitIdentity = (req: Request) => {
  if (req.user?.id) {
    return {
      tier: "authenticated" as const,
      key: `user:${req.user.id}`,
    };
  }

  return {
    tier: "anonymous" as const,
    key: `ip:${getClientIp(req)}`,
  };
};

export const createRateLimitMiddleware = ({
  name,
  anonymousLimit,
  authenticatedLimit,
  windowMs,
}: RateLimitOptions) => {
  if (anonymousLimit <= 0 || authenticatedLimit <= 0 || windowMs <= 0) {
    throw new Error("INVALID_RATE_LIMIT_CONFIGURATION");
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    cleanupExpiredBuckets(now);

    const identity = getRateLimitIdentity(req);
    const allowedLimit =
      identity.tier === "authenticated" ? authenticatedLimit : anonymousLimit;
    const bucketKey = `${name}:${identity.key}`;
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", String(allowedLimit));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(allowedLimit - 1, 0)));
      return next();
    }

    if (bucket.count >= allowedLimit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("X-RateLimit-Limit", String(allowedLimit));
      res.setHeader("X-RateLimit-Remaining", "0");

      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      });
    }

    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(allowedLimit));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(allowedLimit - bucket.count, 0))
    );
    return next();
  };
};

const assertObjectBody = (req: Request) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      "Request body must be a JSON object."
    );
  }
};

const validateTrimmedString = (
  req: Request,
  { field, maxLength, required = true }: RequestLimitOptions
) => {
  const value = req.body?.[field];

  if (value == null || value === "") {
    if (required) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `${field} is required.`
      );
    }
    return;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      `${field} must be a string.`
    );
  }

  const trimmed = safeTrim(value);
  if (!trimmed) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      `${field} must not be empty.`
    );
  }

  if (trimmed.length > maxLength) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      413,
      `${field} exceeds the maximum allowed length.`
    );
  }

  req.body[field] = trimmed;
};

const validateHistory = (history: unknown): ChatHistoryMessage[] => {
  if (history == null) {
    return [];
  }

  if (!Array.isArray(history)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      "history must be an array."
    );
  }

  if (history.length > MAX_CHAT_HISTORY_MESSAGES) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      413,
      "history exceeds the maximum allowed number of messages."
    );
  }

  return history.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `history[${index}] must be an object.`
      );
    }

    const role = "role" in item ? item.role : undefined;
    const content = "content" in item ? item.content : undefined;

    if (role !== "user" && role !== "assistant") {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `history[${index}].role is invalid.`
      );
    }

    if (typeof content !== "string") {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `history[${index}].content must be a string.`
      );
    }

    const trimmed = safeTrim(content);

    if (!trimmed) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `history[${index}].content must not be empty.`
      );
    }

    if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        413,
        `history[${index}].content exceeds the maximum allowed length.`
      );
    }

    return {
      role,
      content: trimmed,
    };
  });
};

export const validateExecutionRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    assertObjectBody(req);
    validateTrimmedString(req, {
      field: "code",
      maxLength: MAX_CODE_LENGTH,
    });
    validateTrimmedString(req, {
      field: "language",
      maxLength: MAX_LANGUAGE_LENGTH,
    });
    if (req.body.stdin != null && req.body.stdin !== "") {
      if (typeof req.body.stdin !== "string") {
        throw new AppError(
          "INVALID_REQUEST_BODY",
          400,
          "stdin must be a string."
        );
      }

      if (req.body.stdin.length > MAX_STDIN_LENGTH) {
        throw new AppError(
          "PAYLOAD_TOO_LARGE",
          413,
          "stdin exceeds the maximum allowed length."
        );
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateAnalysisRequest = validateExecutionRequest;

export const validatePasswordResetRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    assertObjectBody(req);
    validateTrimmedString(req, {
      field: "email",
      maxLength: MAX_EMAIL_LENGTH,
    });

    const email = String(req.body.email);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "email must be a valid email address."
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateChatRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    assertObjectBody(req);
    validateTrimmedString(req, {
      field: "message",
      maxLength: MAX_CHAT_MESSAGE_LENGTH,
    });

    req.body.history = validateHistory(req.body.history);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateChatBatchRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    assertObjectBody(req);
    validateTrimmedString(req, {
      field: "threadId",
      maxLength: MAX_THREAD_ID_LENGTH,
      required: false,
    });
    validateTrimmedString(req, {
      field: "sessionId",
      maxLength: MAX_SESSION_ID_LENGTH,
      required: false,
    });
    validateTrimmedString(req, {
      field: "title",
      maxLength: MAX_CHAT_TITLE_LENGTH,
      required: false,
    });
    if (!Array.isArray(req.body.messages)) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "messages must be an array."
      );
    }

    if (req.body.messages.length === 0) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "messages must contain at least one item."
      );
    }

    if (req.body.messages.length > MAX_CHAT_BATCH_MESSAGES) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        413,
        "messages exceeds the maximum allowed number of items."
      );
    }

    req.body.messages = req.body.messages.map(
      (message: unknown, index: number) => {
        if (!message || typeof message !== "object" || Array.isArray(message)) {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `messages[${index}] must be an object.`
          );
        }

        const role = "role" in message ? message.role : undefined;
        const content = "content" in message ? message.content : undefined;
        const provider =
          "provider" in message && typeof message.provider === "string"
            ? safeTrim(message.provider)
            : undefined;
        const model =
          "model" in message && typeof message.model === "string"
            ? safeTrim(message.model)
            : undefined;
        const sequence =
          "sequence" in message ? (message.sequence as unknown) : undefined;

        if (role !== "user" && role !== "assistant") {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `messages[${index}].role is invalid.`
          );
        }

        if (typeof content !== "string") {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `messages[${index}].content must be a string.`
          );
        }

        const trimmedContent = safeTrim(content);

        if (!trimmedContent) {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `messages[${index}].content must not be empty.`
          );
        }

        if (trimmedContent.length > MAX_CHAT_MESSAGE_LENGTH) {
          throw new AppError(
            "PAYLOAD_TOO_LARGE",
            413,
            `messages[${index}].content exceeds the maximum allowed length.`
          );
        }

        if (
          sequence !== undefined &&
          (!Number.isInteger(sequence) || Number(sequence) <= 0)
        ) {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `messages[${index}].sequence must be a positive integer.`
          );
        }

        if (provider && provider.length > MAX_LANGUAGE_LENGTH) {
          throw new AppError(
            "PAYLOAD_TOO_LARGE",
            413,
            `messages[${index}].provider exceeds the maximum allowed length.`
          );
        }

        if (model && model.length > 64) {
          throw new AppError(
            "PAYLOAD_TOO_LARGE",
            413,
            `messages[${index}].model exceeds the maximum allowed length.`
          );
        }

        return {
          role,
          content: trimmedContent,
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
          ...(sequence !== undefined ? { sequence } : {}),
        };
      }
    );

    if (!req.body.threadId && !req.body.sessionId) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "threadId or sessionId is required."
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateOptionalExecutionString = (
  value: unknown,
  field: string,
  maxLength: number
) => {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      `${field} must be a string.`
    );
  }

  if (value.length > maxLength) {
    throw new AppError(
      "PAYLOAD_TOO_LARGE",
      413,
      `${field} exceeds the maximum allowed length.`
    );
  }

  return value;
};

const validateComplexityObject = (value: unknown, field: string) => {
  if (value == null) {
    return null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
      `${field} must be an object.`
    );
  }

  const typed = value as Record<string, unknown>;
  const time = typed.time;
  validateOptionalExecutionString(typed.space, `${field}.space`, 128);

  if (time != null) {
    if (!time || typeof time !== "object" || Array.isArray(time)) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        `${field}.time must be an object.`
      );
    }

    const typedTime = time as Record<string, unknown>;
    validateOptionalExecutionString(typedTime.best, `${field}.time.best`, 128);
    validateOptionalExecutionString(
      typedTime.average,
      `${field}.time.average`,
      128
    );
    validateOptionalExecutionString(typedTime.worst, `${field}.time.worst`, 128);
  }

  return value;
};

export const validateSessionSaveRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    assertObjectBody(req);
    validateTrimmedString(req, {
      field: "title",
      maxLength: MAX_SESSION_TITLE_LENGTH,
      required: false,
    });
    validateTrimmedString(req, {
      field: "sessionId",
      maxLength: MAX_SESSION_ID_LENGTH,
      required: false,
    });

    if (!Array.isArray(req.body.executions)) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "executions must be an array."
      );
    }

    if (req.body.executions.length === 0) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
        "executions must contain at least one item."
      );
    }

    if (req.body.executions.length > MAX_EXECUTIONS_PER_SESSION) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        413,
        "executions exceeds the maximum allowed number of items."
      );
    }

    req.body.executions = req.body.executions.map(
      (execution: unknown, index: number) => {
        if (
          !execution ||
          typeof execution !== "object" ||
          Array.isArray(execution)
        ) {
          throw new AppError(
            "INVALID_REQUEST_BODY",
            400,
            `executions[${index}] must be an object.`
          );
        }

        const typed = execution as Record<string, unknown>;
        const normalizedExecution = {
          code: typed.code,
          language: typed.language,
          output: validateOptionalExecutionString(
            typed.output,
            `executions[${index}].output`,
            MAX_OUTPUT_LENGTH
          ),
          error: validateOptionalExecutionString(
            typed.error,
            `executions[${index}].error`,
            MAX_OUTPUT_LENGTH
          ),
          runtime:
            typeof typed.runtime === "number" && Number.isFinite(typed.runtime)
              ? typed.runtime
              : 0,
          memory:
            typeof typed.memory === "number" && Number.isFinite(typed.memory)
              ? typed.memory
              : 0,
          ai: typed.ai,
        } as Record<string, unknown>;

        const nestedReq = { body: normalizedExecution } as Request;
        validateTrimmedString(nestedReq, {
          field: "code",
          maxLength: MAX_CODE_LENGTH,
        });
        validateTrimmedString(nestedReq, {
          field: "language",
          maxLength: MAX_LANGUAGE_LENGTH,
        });

        if (typed.ai != null) {
          if (!typed.ai || typeof typed.ai !== "object" || Array.isArray(typed.ai)) {
            throw new AppError(
              "INVALID_REQUEST_BODY",
              400,
              `executions[${index}].ai must be an object.`
            );
          }

          const typedAi = typed.ai as Record<string, unknown>;

          if (
            typedAi.pseudocode != null &&
            (!Array.isArray(typedAi.pseudocode) ||
              typedAi.pseudocode.some(
                (item) => typeof item !== "string" || item.length > 500
              ))
          ) {
            throw new AppError(
              "INVALID_REQUEST_BODY",
              400,
              `executions[${index}].ai.pseudocode is invalid.`
            );
          }

          if (
            typedAi.algorithmSteps != null &&
            (!Array.isArray(typedAi.algorithmSteps) ||
              typedAi.algorithmSteps.length > MAX_ALGORITHM_STEPS ||
              typedAi.algorithmSteps.some(
                (item) => typeof item !== "string" || item.length > 500
              ))
          ) {
            throw new AppError(
              "INVALID_REQUEST_BODY",
              400,
              `executions[${index}].ai.algorithmSteps is invalid.`
            );
          }

          validateOptionalExecutionString(
            typedAi.algorithmName,
            `executions[${index}].ai.algorithmName`,
            MAX_ALGORITHM_NAME_LENGTH
          );
          validateOptionalExecutionString(
            typedAi.explanation,
            `executions[${index}].ai.explanation`,
            8_000
          );
          validateComplexityObject(
            typedAi.complexity,
            `executions[${index}].ai.complexity`
          );

          if (typedAi.trace != null) {
            if (!Array.isArray(typedAi.trace)) {
              throw new AppError(
                "INVALID_REQUEST_BODY",
                400,
                `executions[${index}].ai.trace must be an array.`
              );
            }

            if (typedAi.trace.length > MAX_TRACE_ITEMS) {
              throw new AppError(
                "PAYLOAD_TOO_LARGE",
                413,
                `executions[${index}].ai.trace exceeds the maximum allowed number of items.`
              );
            }
          }
        }

        return normalizedExecution;
      }
    );

    next();
  } catch (error) {
    next(error);
  }
};

export const expensiveEndpointRateLimits = {
  execution: createRateLimitMiddleware({
    name: "execution",
    anonymousLimit: 20,
    authenticatedLimit: 60,
    windowMs: 60_000,
  }),
  analysis: createRateLimitMiddleware({
    name: "analysis",
    anonymousLimit: 15,
    authenticatedLimit: 45,
    windowMs: 60_000,
  }),
  chat: createRateLimitMiddleware({
    name: "chat",
    anonymousLimit: 20,
    authenticatedLimit: 60,
    windowMs: 60_000,
  }),
  chatBatch: createRateLimitMiddleware({
    name: "chat-batch",
    anonymousLimit: 30,
    authenticatedLimit: 90,
    windowMs: 60_000,
  }),
  workspace: createRateLimitMiddleware({
    name: "workspace",
    anonymousLimit: 8,
    authenticatedLimit: 20,
    windowMs: 60_000,
  }),
  passwordResetRequest: createRateLimitMiddleware({
    name: "password-reset-request",
    anonymousLimit: 3,
    authenticatedLimit: 5,
    windowMs: 15 * 60_000,
  }),
  sessionSave: createRateLimitMiddleware({
    name: "session-save",
    anonymousLimit: 5,
    authenticatedLimit: 20,
    windowMs: 5 * 60_000,
  }),
  sessionRead: createRateLimitMiddleware({
    name: "session-read",
    anonymousLimit: 10,
    authenticatedLimit: 120,
    windowMs: 60_000,
  }),
  languageList: createRateLimitMiddleware({
    name: "language-list",
    anonymousLimit: 30,
    authenticatedLimit: 120,
    windowMs: 5 * 60_000,
  }),
  chatRead: createRateLimitMiddleware({
    name: "chat-read",
    anonymousLimit: 5,
    authenticatedLimit: 120,
    windowMs: 60_000,
  }),
};

export const __testing__ = {
  resetRateLimitBuckets: () => {
    buckets.clear();
    nextCleanupAt = Date.now() + DEFAULT_CLEANUP_INTERVAL_MS;
  },
};
