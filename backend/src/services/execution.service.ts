import { executeJudge0 } from "../integrations/judge0";
import { executePiston } from "../integrations/piston";
import { cacheService } from "./cache.service";
import { logger } from "../utils/logger";

export const executeCode = async (code: string, language: string) => {
  const cacheKey = cacheService.getExecutionCacheKey(code, language);

  //Check cache
  const cached = cacheService.get(cacheKey);
  if (cached) {
    logger.info("execution.cache.hit", {
      cache_key: cacheKey,
      language,
    });
    return {
      ...cached,
      source: "cache",
    };
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
      const judge0Result = await executeJudge0(code, language);

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
      const pistonResult = await executePiston(code, language);

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
