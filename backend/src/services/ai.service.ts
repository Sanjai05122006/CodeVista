import { generateGeminiAnalysis } from "../integrations/gemini";
import { AIServiceError } from "../errors/ai.error";
import { cacheService } from "./cache.service";
import { AnalysisResponse, AnalysisResult } from "../types/analysis";
import { sha256 } from "../utils/hash";
import { logger } from "../utils/logger";
import { normalizeAnalysis, safeParse } from "../utils/analysis-normalizer";

type CacheLike = Pick<typeof cacheService, "get" | "set">;

type AnalyzeDependencies = {
  provider?: (prompt: string) => Promise<string>;
  cache?: CacheLike;
};

type CacheEntry = {
  data: AnalysisResponse;
  timestamp: number;
  ttl: number;
};

export const PROMPT_VERSION = "v4";
const MAX_NETWORK_RETRIES = 3;
const VALID_TTL_MINUTES = 60 * 24;
const FALLBACK_TTL_MINUTES = 5;
const RATE_LIMIT_TOKENS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const analysisCache = new Map<string, CacheEntry>();
let tokens = RATE_LIMIT_TOKENS;
let lastRefill = Date.now();
let queue: Promise<void> = Promise.resolve();
let isRateLimited = false;
let rateLimitResetTime = 0;

export const MASTER_PROMPT = `
You are a lightweight code analysis engine.

Return ONLY valid JSON:

{
pseudocode
algorithm_steps
time_complexity
space_complexity
}

Rules:

* DO NOT include algorithm name
* DO NOT include explanation
* DO NOT include any extra fields
* DO NOT include markdown
* DO NOT include text outside JSON
* Keep pseudocode short (5-8 lines max)
* Keep algorithm_steps short (4-8 lines max)
* Use simple numbered steps for pseudocode and algorithm_steps
* Pseudocode is required
* algorithm_steps is required
* Always return valid JSON

IMPORTANT:
Even if unsure, return valid JSON with best guess.

Language: {{language}}

Code:
{{code}}
`;

export const buildPrompt = (code: string, language: string) => {
  return MASTER_PROMPT.replace("{{language}}", language).replace(
    "{{code}}",
    code
  );
};

export const getAnalysisCacheKey = (
  code: string,
  language: string,
  promptVersion: string = PROMPT_VERSION
) => {
  return `analysis:${sha256(`${promptVersion}:${language}:${code}`)}`;
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const resetCooldownIfExpired = () => {
  if (isRateLimited && Date.now() >= rateLimitResetTime) {
    isRateLimited = false;
    rateLimitResetTime = 0;
  }
};

const refillTokens = () => {
  const now = Date.now();
  const elapsed = now - lastRefill;

  if (elapsed > RATE_LIMIT_WINDOW_MS) {
    tokens = RATE_LIMIT_TOKENS;
    lastRefill = now;
  }
};

export const acquireToken = async () => {
  refillTokens();

  while (tokens <= 0) {
    await sleep(1000);
    refillTokens();
  }

  tokens -= 1;
};

export const enqueue = async <T>(task: () => Promise<T>): Promise<T> => {
  logger.info("analysis.queued");

  const run = queue.then(task);
  queue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};

const getLocalCache = (cacheKey: string): AnalysisResponse | null => {
  const entry = analysisCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > entry.ttl) {
    analysisCache.delete(cacheKey);
    return null;
  }

  return entry.data;
};

const setLocalCache = (
  cacheKey: string,
  data: AnalysisResponse,
  ttlMinutes: number
) => {
  analysisCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000,
  });
};

const isRateLimitedError = (error: AIServiceError) => {
  return error.status === 429 || error.message.includes("429") || /retry/i.test(error.message);
};

export const extractRetryDelay = (message: string) => {
  const retryMatch = message.match(/retry in (\d+(\.\d+)?)s/i);
  if (retryMatch) {
    const seconds = Number.parseFloat(retryMatch[1]);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.round(seconds * 1000), 60000);
    }
  }

  const secondsMatch = message.match(/(\d+(\.\d+)?)\s*(second|seconds|sec|s)/i);
  if (secondsMatch) {
    const seconds = Number.parseFloat(secondsMatch[1]);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(Math.round(seconds * 1000), 60000);
    }
  }

  const msMatch = message.match(/(\d+)\s*(millisecond|milliseconds|ms)/i);
  if (msMatch) {
    const milliseconds = Number.parseInt(msMatch[1], 10);
    if (Number.isFinite(milliseconds) && milliseconds >= 0) {
      return Math.min(milliseconds, 60000);
    }
  }

  return 60000;
};

const fallbackResponse: AnalysisResponse = {
  pseudocode: [],
  algorithm_steps: [],
  time_complexity: {
    best: "N/A",
    average: "N/A",
    worst: "N/A",
  },
  space_complexity: "N/A",
};

const parseAndNormalizeAnalysis = (rawText: string): AnalysisResponse => {
  const parsed = safeParse(rawText);

  if (!parsed) {
    logger.warn("analysis.partial_used", {
      reason: "parse_failed",
    });
    return fallbackResponse;
  }

  const normalized = normalizeAnalysis(parsed);
  logger.info("analysis.normalized");

  return normalized;
};

const isFallbackResult = (result: AnalysisResponse) => {
  return (
    result.pseudocode.length === 0 &&
    result.algorithm_steps.length === 0 &&
    result.time_complexity.best === "N/A" &&
    result.time_complexity.average === "N/A" &&
    result.time_complexity.worst === "N/A" &&
    result.space_complexity === "N/A"
  );
};

const callGeminiWithRateLimit = async (
  provider: (prompt: string) => Promise<string>,
  prompt: string,
  cacheKey: string,
  language: string
) => {
  resetCooldownIfExpired();

  if (isRateLimited && Date.now() < rateLimitResetTime) {
    throw new AIServiceError(
      "AI_NETWORK_ERROR",
      `cooldown active until ${rateLimitResetTime}`
    );
  }

  return enqueue(async () => {
    resetCooldownIfExpired();

    if (isRateLimited && Date.now() < rateLimitResetTime) {
      throw new AIServiceError(
        "AI_NETWORK_ERROR",
        `cooldown active until ${rateLimitResetTime}`
      );
    }

    await acquireToken();

    try {
      return await provider(prompt);
    } catch (error: any) {
      const serviceError =
        error instanceof AIServiceError
          ? error
          : new AIServiceError(
              "AI_PROVIDER_ERROR",
              error.message || "Unknown AI provider failure"
            );

      if (isRateLimitedError(serviceError)) {
        const delay = extractRetryDelay(serviceError.message);
        isRateLimited = true;
        rateLimitResetTime = Date.now() + delay;
        logger.warn("analysis.cooldown_enabled", {
          cache_key: cacheKey,
          language,
          delay,
        });
        throw serviceError;
      }

      throw serviceError;
    }
  });
};

export const analyzeCode = async (
  code: string,
  language: string,
  dependencies: AnalyzeDependencies = {}
): Promise<AnalysisResult> => {
  const activeCache = dependencies.cache || cacheService;
  const provider = dependencies.provider || generateGeminiAnalysis;
  const cacheKey = getAnalysisCacheKey(code, language);
  resetCooldownIfExpired();

  const localCached = getLocalCache(cacheKey);
  if (localCached) {
    logger.info("analysis.cache.hit", {
      cache_key: cacheKey,
      language,
      prompt_version: PROMPT_VERSION,
      cache_layer: "memory",
    });
    return {
      ...localCached,
      source: "cache",
    };
  }

  const cached = activeCache.get<AnalysisResponse>(cacheKey);
  if (cached) {
    setLocalCache(cacheKey, cached, VALID_TTL_MINUTES);
    logger.info("analysis.cache.hit", {
      cache_key: cacheKey,
      language,
      prompt_version: PROMPT_VERSION,
      cache_layer: "service",
    });
    return {
      ...cached,
      source: "cache",
    };
  }

  if (isRateLimited && Date.now() < rateLimitResetTime) {
    logger.warn("analysis.cooldown_active", {
      cache_key: cacheKey,
      language,
      reset_time: rateLimitResetTime,
    });

    const serviceCached = activeCache.get<AnalysisResponse>(cacheKey);
    if (serviceCached) {
      setLocalCache(cacheKey, serviceCached, VALID_TTL_MINUTES);
      logger.info("analysis.cache.hit", {
        cache_key: cacheKey,
        language,
        prompt_version: PROMPT_VERSION,
        cache_layer: "service",
      });
      return {
        ...serviceCached,
        source: "cache",
      };
    }

    activeCache.set(cacheKey, fallbackResponse, FALLBACK_TTL_MINUTES);
    setLocalCache(cacheKey, fallbackResponse, FALLBACK_TTL_MINUTES);

    return {
      ...fallbackResponse,
      source: "gemini",
    };
  }

  logger.info("analysis.cache.miss", {
    cache_key: cacheKey,
    language,
    prompt_version: PROMPT_VERSION,
  });

  const prompt = buildPrompt(code, language);
  let lastError: AIServiceError | null = null;
  let networkRetries = 0;

  while (true) {
    try {
      const rawText = await callGeminiWithRateLimit(
        provider,
        prompt,
        cacheKey,
        language
      );
      const result = parseAndNormalizeAnalysis(rawText);
      const ttlMinutes = isFallbackResult(result)
        ? FALLBACK_TTL_MINUTES
        : VALID_TTL_MINUTES;

      activeCache.set(cacheKey, result, ttlMinutes);
      setLocalCache(cacheKey, result, ttlMinutes);
      logger.info("analysis.cache.set", {
        cache_key: cacheKey,
        language,
        prompt_version: PROMPT_VERSION,
        ttl_minutes: ttlMinutes,
      });
      logger.info("analysis.success", {
        source: "gemini",
        cache_key: cacheKey,
        language,
      });

      return {
        ...result,
        source: "gemini",
      };
    } catch (error: any) {
      lastError =
        error instanceof AIServiceError
          ? error
          : new AIServiceError(
              "AI_PROVIDER_ERROR",
              error.message || "Unknown AI provider failure"
            );

      if (isRateLimitedError(lastError)) {
        const delay = extractRetryDelay(lastError.message);
        isRateLimited = true;
        rateLimitResetTime = Date.now() + delay;
        logger.warn("analysis.cooldown_enabled", {
          cache_key: cacheKey,
          language,
          delay,
        });
        logger.warn("analysis.cooldown_active", {
          cache_key: cacheKey,
          language,
          reset_time: rateLimitResetTime,
        });
        break;
      }

      if (
        lastError.code === "AI_NETWORK_ERROR" &&
        networkRetries < MAX_NETWORK_RETRIES
      ) {
        const delay = 1000 * 2 ** networkRetries;
        logger.warn("analysis.retry", {
          attempt: networkRetries + 1,
          delay,
          reason: lastError.code,
        });
        networkRetries += 1;
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  logger.error("analysis.fallback", {
    cache_key: cacheKey,
    language,
    prompt_version: PROMPT_VERSION,
    reason: lastError?.code || "UNKNOWN",
  });

  const currentCacheEntry = getLocalCache(cacheKey) || activeCache.get<AnalysisResponse>(cacheKey);
  if (currentCacheEntry) {
    return {
      ...currentCacheEntry,
      source: "cache",
    };
  }

  activeCache.set(cacheKey, fallbackResponse, FALLBACK_TTL_MINUTES);
  setLocalCache(cacheKey, fallbackResponse, FALLBACK_TTL_MINUTES);

  return {
    ...fallbackResponse,
    source: "gemini",
  };
};
