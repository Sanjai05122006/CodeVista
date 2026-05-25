import { executeJudge0 } from "../integrations/judge0";
import { executePiston } from "../integrations/piston";
import { cacheService } from "./cache.service";
import { logger } from "../utils/logger";

const MAX_OUTPUT_LENGTH = 8000;
const TRUNCATION_SUFFIX = "\n\n[output truncated by CodeVista]";

export const executeCode = (
  code: string,
  language: string,
  stdin: string = ""
) => {
  return executeCodeInternal(code, language, stdin);
};

const executeCodeInternal = async (
  code: string,
  language: string,
  stdin: string
) => {
  const cacheKey = cacheService.getExecutionCacheKey(code, language, stdin);

  //Check cache
  const cached = cacheService.get(cacheKey);
  if (cached) {
    logger.info("execution.cache.hit", {
      cache_key: cacheKey,
      language,
    });
    return applyOutputGuards({
      ...cached,
      source: "cache",
    }, language, "cache");
  }

  logger.info("execution.cache.miss", {
    cache_key: cacheKey,
    language,
  });

  let result: any = null;
  let lastError: Error | null = null;

  //Retry logic (2 attempts)
  for (let i = 0; i < 2; i++) {
    try {
      const judge0Result = await executeJudge0(code, language, stdin);

      result = {
        ...formatResponse(judge0Result),
        source: "judge0",
      };

      logger.info("execution.provider.success", {
        provider: "judge0",
        language,
      });
      break;
    } catch (err) {
      lastError = err as Error;
      logger.warn("execution.provider.retry", {
        provider: "judge0",
        attempt: i + 1,
        language,
        message: lastError.message,
      });
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  //If all attempts fail → graceful error response
  if (!result) {
    logger.warn("execution.provider.failed", {
      provider: "judge0",
      language,
      message: lastError?.message,
    });

    try {
      const pistonResult = await executePiston(code, language, stdin);

      result = {
        ...formatPistonResponse(pistonResult),
        source: "piston",
      };

      logger.info("execution.provider.success", {
        provider: "piston",
        language,
      });
    } catch (pistonError) {
      const typedError =
        pistonError instanceof Error
          ? pistonError
          : new Error("Piston execution failed");

      logger.error("execution.providers.exhausted", {
        language,
        message: typedError.message,
      });

      return {
        stdout: "",
        stderr: "",
        runtime_ms: 0,
        memory_kb: 0,
        status: "Service Unavailable",
        error: {
          code: "EXECUTION_SERVICE_UNAVAILABLE",
          message: "Execution service is temporarily unavailable",
        },
        source: "system",
      };
    }
  }

  result = applyOutputGuards(result, language, result.source || "unknown");

  // ✅ Cache only successful results
  cacheService.set(cacheKey, result, 60);
  logger.info("execution.cache.set", {
    cache_key: cacheKey,
    language,
  });

  return result;
};

//Format Judge0 response
function formatResponse(judge0Result: any) {
  return {
    stdout: judge0Result.stdout || "",
    stderr:
      judge0Result.stderr ||
      judge0Result.compile_output ||
      "",
    runtime_ms: Number(judge0Result.time) * 1000 || 0,
    memory_kb: judge0Result.memory || 0,
    status: judge0Result.status?.description || "Unknown",
  };
}

function formatPistonResponse(pistonResult: any) {
  const run = pistonResult?.run ?? {};

  return {
    stdout: run.stdout || "",
    stderr: run.stderr || "",
    runtime_ms: Math.round((Number(run.time) || 0) * 1000),
    memory_kb: Math.round((Number(run.memory) || 0) / 1024),
    status: run.code === 0 ? "Accepted" : "Runtime Error",
  };
}

function trimOutput(value: string) {
  if (value.length <= MAX_OUTPUT_LENGTH) {
    return value;
  }

  return (
    value.slice(0, Math.max(0, MAX_OUTPUT_LENGTH - TRUNCATION_SUFFIX.length)) +
    TRUNCATION_SUFFIX
  );
}

function applyOutputGuards<
  T extends {
    [key: string]: unknown;
    stdout?: string;
    stderr?: string;
  },
>(result: T, language: string, source: string): T {
  const stdout = trimOutput(result.stdout || "");
  const stderr = trimOutput(result.stderr || "");

  if (stdout !== (result.stdout || "") || stderr !== (result.stderr || "")) {
    logger.warn("execution.output.truncated", {
      language,
      source,
      stdout_length: (result.stdout || "").length,
      stderr_length: (result.stderr || "").length,
      max_output_length: MAX_OUTPUT_LENGTH,
    });
  }

  return {
    ...result,
    stdout,
    stderr,
  };
}
