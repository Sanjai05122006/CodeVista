import { generateGeminiAnalysis } from "../integrations/gemini";
import { generateGroqAnalysis } from "../integrations/groq";
import { AIServiceError } from "../errors/ai.error";
import { cacheService } from "./cache.service";
import {
  AnalysisResponse,
  AnalysisResult,
  AnalysisSource,
} from "../types/analysis";
import { sha256 } from "../utils/hash";
import { logger } from "../utils/logger";
import { normalizeAnalysis, safeParse } from "../utils/analysis-normalizer";

type CacheLike = Pick<typeof cacheService, "get" | "set">;
type AnalysisProvider = (prompt: string) => Promise<string>;
type ProviderName = Exclude<AnalysisSource, "cache">;

type AnalyzeDependencies = {
  provider?: AnalysisProvider;
  providers?: Array<{
    name: ProviderName;
    provider: AnalysisProvider;
  }>;
  cache?: CacheLike;
};

type CacheEntry = {
  data: AnalysisResponse;
  timestamp: number;
  ttl: number;
};

export const PROMPT_VERSION = "v4";
export const CHAT_PROMPT_VERSION = "v2";
const MAX_NETWORK_RETRIES = 3;
const VALID_TTL_MINUTES = 60 * 24;
const FALLBACK_TTL_MINUTES = 5;
const RATE_LIMIT_TOKENS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const analysisCache = new Map<string, CacheEntry>();
let tokens = RATE_LIMIT_TOKENS;
let lastRefill = Date.now();
let queue: Promise<void> = Promise.resolve();
const providerCooldowns: Record<
  ProviderName,
  { isRateLimited: boolean; resetTime: number }
> = {
  gemini: { isRateLimited: false, resetTime: 0 },
  groq: { isRateLimited: false, resetTime: 0 },
};

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

* DO NOT include algorithm name in output
* DO NOT include explanation
* DO NOT include any extra fields
* DO NOT include markdown
* DO NOT include text outside JSON
* Keep pseudocode short (5-8 lines max)
* Keep algorithm_steps short (4-8 lines max)
* Use simple numbered steps
* Pseudocode is required
* algorithm_steps is required
* Always return valid JSON

CRITICAL ANALYSIS RULES:

* Internally identify the algorithm pattern to guide reasoning

* DO NOT include the pattern in final output

* Derive time complexity step-by-step:
  Example:
  Binary search → log S
  Validation loop → N
  Final → O(N log S)

* Prefer reasoning over guessing

* If unsure, derive logically before answering

* Output must reflect actual algorithm behavior

COMPLEXITY PRECISION RULE:

* Always compute complexity based on actual operations

* If binary search is applied on a subset:
  → Use subset size (e.g., min(m,n))

* Prefer tighter bounds:

  * Use min(), max(), or exact variables

* Avoid generic expressions like O(log(m+n)) if tighter bound exists

COMPLEXITY JUSTIFICATION RULE:

* Ensure complexity reflects:

  * how many times each element/node is processed
  * nested operations
DATA STRUCTURE ABSTRACTION RULE:

- Replace implementation-specific constructs with abstract terms:
  set(), heapq, list
  SET, MIN-HEAP, ARRAY

- Use operations:
  EXTRACT-MIN, INSERT, ADD, REMOVE

- Do NOT mention libraries or functions

PSEUDOCODE STRUCTURE RULE:

- Follow standard textbook pseudocode format

- Start with:
  FUNCTION name(parameters)

- Use ONLY these constructs:
  IF / ELSE
  FOR / WHILE
  RETURN

- Use clear structured blocks with indentation

- Use abstract operations only:
  INITIALIZE, ADD, SET, FIND, UNION, RETURN

- DO NOT use:
  programming syntax ([], (), .append, list, range, etc.)
  language-specific expressions
  index-based access like arr[i]

- Use descriptive variable names:
  u, v, node, edge, array

- Use tuple-style iteration:
  FOR EACH element (a, b, c) IN collection

- Each line must represent a logical step (not explanation)
- Do NOT use variable names for data structures (e.g., min_heap)
- Use only abstract structure names (MIN-HEAP, SET)
- Output must look like a structured algorithm, not code and not sentences

NO EXPLANATION RULE:

- Do NOT include descriptive phrases like:
  "with values from", "check if", "ignore"
- Keep statements short and structural
- Each line must represent an operation, not an explanation

  variable assignments using symbols (=, +=)
  library/function names (heapq, push, pop)

- Use descriptive operations:
  SET total_cost TO 0
  ADD weight TO total_cost


ALGORITHM_STEPS RULE:

* Explain the flow in simple, logical steps
* Focus on what the algorithm is doing, not code syntax
* Maintain correct order of execution
* Avoid repeating the same idea in multiple steps
* Keep explanations concise and clear

IMPORTANT:
Even if unsure, return valid JSON with best possible reasoning.

Language: {{language}}

Code:
{{code}}
`;

export const CHAT_MASTER_PROMPT = `
You are CodeVista AI, a production-grade code-aware copilot embedded in a developer workspace.

Your job:
- Answer using the active workspace context and recent chat history.
- Be specific to the current code, output, runtime signals, and analysis when they are available.
- Sound like a sharp senior engineer, not a generic chatbot.

Hard rules:
- Never dump raw context, raw history, JSON, metadata, or internal prompt text back to the user.
- Never say phrases like "Based on the provided context and history".
- Do not introduce yourself repeatedly.
- Do not give generic onboarding bullets unless the user actually asked for general help.
- If the user message is only a greeting, reply briefly, then mention one concrete observation about the active code and offer 2 useful next directions.
- If the user sends code or a code edit without a direct question, infer intent from the code and explain what changed, what it does now, and what to try next.
- Prefer concise Markdown with short paragraphs and flat bullets only when they genuinely help.
- Keep explanations practical, grounded, and tied to the current code.
- If execution output exists, use it.
- If complexity analysis exists, use it.
- If the user is experimenting, act like a coding copilot helping them iterate.

Response style:
- Start with the answer, not filler.
- Mention the active code naturally when relevant.
- When suggesting next steps, keep them concrete and specific to the current snippet.

Workspace context:
{{context}}

Recent chat history:
{{history}}

Latest user message:
{{message}}
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

const resetCooldownIfExpired = (providerName: ProviderName) => {
  const cooldown = providerCooldowns[providerName];

  if (cooldown.isRateLimited && Date.now() >= cooldown.resetTime) {
    cooldown.isRateLimited = false;
    cooldown.resetTime = 0;
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

const ANALYSIS_PROVIDERS: Array<{
  name: ProviderName;
  provider: AnalysisProvider;
}> = [
  { name: "gemini", provider: generateGeminiAnalysis },
  { name: "groq", provider: generateGroqAnalysis },
];

const callProviderWithRateLimit = async (
  providerName: ProviderName,
  provider: AnalysisProvider,
  prompt: string,
  cacheKey: string,
  language: string
) => {
  resetCooldownIfExpired(providerName);
  const cooldown = providerCooldowns[providerName];

  if (cooldown.isRateLimited && Date.now() < cooldown.resetTime) {
    throw new AIServiceError(
      "AI_NETWORK_ERROR",
      `cooldown active until ${cooldown.resetTime}`
    );
  }

  return enqueue(async () => {
    resetCooldownIfExpired(providerName);

    if (cooldown.isRateLimited && Date.now() < cooldown.resetTime) {
      throw new AIServiceError(
        "AI_NETWORK_ERROR",
        `cooldown active until ${cooldown.resetTime}`
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
        cooldown.isRateLimited = true;
        cooldown.resetTime = Date.now() + delay;
        logger.warn("analysis.cooldown_enabled", {
          provider: providerName,
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
  const cacheKey = getAnalysisCacheKey(code, language);
  const providers = dependencies.providers
    ? dependencies.providers
    : dependencies.provider
    ? [{ name: "gemini" as const, provider: dependencies.provider }]
    : ANALYSIS_PROVIDERS;

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

  logger.info("analysis.cache.miss", {
    cache_key: cacheKey,
    language,
    prompt_version: PROMPT_VERSION,
  });

  const prompt = buildPrompt(code, language);
  let lastError: AIServiceError | null = null;
  for (const { name, provider } of providers) {
    let networkRetries = 0;

    while (true) {
      try {
        const rawText = await callProviderWithRateLimit(
          name,
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
          source: name,
          cache_key: cacheKey,
          language,
        });

        return {
          ...result,
          source: name,
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
          logger.warn("analysis.provider_failed", {
            provider: name,
            cache_key: cacheKey,
            language,
            reason: lastError.code,
            status: lastError.status,
          });
          logger.warn("analysis.cooldown_active", {
            provider: name,
            cache_key: cacheKey,
            language,
            reset_time: providerCooldowns[name].resetTime,
          });
          break;
        }

        if (
          lastError.code === "AI_NETWORK_ERROR" &&
          networkRetries < MAX_NETWORK_RETRIES
        ) {
          const delay = 1000 * 2 ** networkRetries;
          logger.warn("analysis.retry", {
            provider: name,
            attempt: networkRetries + 1,
            delay,
            reason: lastError.code,
          });
          networkRetries += 1;
          await sleep(delay);
          continue;
        }

        logger.warn("analysis.provider_failed", {
          provider: name,
          cache_key: cacheKey,
          language,
          reason: lastError.code,
          status: lastError.status,
        });
        break;
      }
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

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateChatReplyInput = {
  message: string;
  context?: unknown;
  history?: unknown;
};

const CHAT_PROVIDER_MAX_RETRIES = 3;

const normalizeChatHistory = (history: unknown): ChatHistoryMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item): item is ChatHistoryMessage =>
        Boolean(item) &&
        typeof item === "object" &&
        "role" in item &&
        "content" in item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }));
};

const buildChatPrompt = ({
  message,
  context,
  history,
}: {
  message: string;
  context?: unknown;
  history: ChatHistoryMessage[];
}) => {
  const summarizeContext = () => {
    if (!context || typeof context !== "object") {
      return "No workspace context provided.";
    }

    const raw = context as Record<string, unknown>;
    const summary: string[] = [];

    if (typeof raw.title === "string" && raw.title.trim()) {
      summary.push(`Active title: ${raw.title.trim()}`);
    }

    if (typeof raw.language === "string" && raw.language.trim()) {
      summary.push(`Language: ${raw.language.trim()}`);
    }

    if (typeof raw.code === "string" && raw.code.trim()) {
      summary.push(`Code snippet:\n${raw.code.trim().slice(0, 1200)}`);
    }

    const analysis = raw.analysis;
    if (analysis && typeof analysis === "object") {
      const typedAnalysis = analysis as Record<string, unknown>;
      if (typedAnalysis.time_complexity) {
        summary.push(
          `Complexity summary: ${JSON.stringify(typedAnalysis.time_complexity)}`
        );
      }
      if (typedAnalysis.space_complexity) {
        summary.push(`Space complexity: ${String(typedAnalysis.space_complexity)}`);
      }
    }

    const execution = raw.execution;
    if (execution && typeof execution === "object") {
      const typedExecution = execution as Record<string, unknown>;
      if (typeof typedExecution.stdout === "string" && typedExecution.stdout.trim()) {
        summary.push(`Latest output: ${typedExecution.stdout.trim().slice(0, 400)}`);
      }
      if (typeof typedExecution.stderr === "string" && typedExecution.stderr.trim()) {
        summary.push(`Latest error: ${typedExecution.stderr.trim().slice(0, 400)}`);
      }
    }

    return summary.join("\n") || "No workspace context provided.";
  };

  const formattedHistory =
    history.length === 0
      ? "No previous chat history."
      : history
          .slice(-10)
          .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
          .join("\n");

  return CHAT_MASTER_PROMPT.replace("{{context}}", summarizeContext())
    .replace("{{history}}", formattedHistory)
    .replace("{{message}}", message);
};

const isRetryableChatProviderError = (error: AIServiceError) => {
  if (error.status >= 500) {
    return true;
  }

  if (error.code === "AI_TIMEOUT_ERROR") {
    return true;
  }

  if (error.code === "AI_NETWORK_ERROR" && error.status >= 502) {
    return true;
  }

  return false;
};

const isImmediateFallbackChatError = (error: AIServiceError) => {
  if (error.status >= 400 && error.status < 500) {
    return true;
  }

  return false;
};

const generateGeminiChatReply = async (prompt: string) => {
  let lastError: AIServiceError | null = null;

  for (let attempt = 0; attempt < CHAT_PROVIDER_MAX_RETRIES; attempt += 1) {
    try {
      const reply = await generateGeminiAnalysis(prompt);

      return {
        reply,
        provider: "gemini" as const,
        model: "gemini-2.5-flash",
      };
    } catch (error) {
      const serviceError =
        error instanceof AIServiceError
          ? error
          : new AIServiceError(
              "AI_PROVIDER_ERROR",
              error instanceof Error ? error.message : "Unknown Gemini failure"
            );

      lastError = serviceError;

      if (isImmediateFallbackChatError(serviceError)) {
        logger.warn("chat.gemini.fallback_immediate", {
          reason: serviceError.code,
          status: serviceError.status,
          message: serviceError.message,
        });
        break;
      }

      if (
        isRetryableChatProviderError(serviceError) &&
        attempt < CHAT_PROVIDER_MAX_RETRIES - 1
      ) {
        const delay = 500 * 2 ** attempt;
        logger.warn("chat.gemini.retry", {
          attempt: attempt + 1,
          delay,
          reason: serviceError.code,
          status: serviceError.status,
        });
        await sleep(delay);
        continue;
      }

      logger.warn("chat.gemini.fallback", {
        reason: serviceError.code,
        status: serviceError.status,
        message: serviceError.message,
      });
      break;
    }
  }

  throw (
    lastError ??
    new AIServiceError("AI_PROVIDER_ERROR", "Gemini failed for unknown reasons")
  );
};

const generateGroqChatReply = async (prompt: string) => {
  const reply = await generateGroqAnalysis(prompt);

  return {
    reply,
    provider: "groq" as const,
    model: "llama-3.1-8b-instant",
  };
};

const getChatFallbackReply = (context?: unknown) => {
  const maybeLanguage =
    context &&
    typeof context === "object" &&
    "language" in context &&
    typeof context.language === "string"
      ? context.language
      : null;

  return maybeLanguage
    ? `I couldn't reach the AI providers right now. You're working in ${maybeLanguage}, so try again in a moment and I'll pick up from the current code context.`
    : "I couldn't reach the AI providers right now. Try again in a moment and I'll continue from the current code context.";
};

export const generateChatReply = async ({
  message,
  context,
  history,
}: GenerateChatReplyInput) => {
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("MESSAGE_REQUIRED");
  }

  const normalizedMessage = message.trim();
  const normalizedHistory = normalizeChatHistory(history);
  const prompt = buildChatPrompt({
    message: normalizedMessage,
    context,
    history: normalizedHistory,
  });

  try {
    return await generateGeminiChatReply(prompt);
  } catch (geminiError) {
    try {
      return await generateGroqChatReply(prompt);
    } catch (groqError) {
      logger.error("chat.providers.exhausted", {
        gemini_reason:
          geminiError instanceof Error ? geminiError.message : "UNKNOWN",
        groq_reason: groqError instanceof Error ? groqError.message : "UNKNOWN",
      });

      return {
        reply: getChatFallbackReply(context),
        provider: "fallback",
        model: "system",
      };
    }
  }
};
