import { executeJudge0 } from "../integrations/judge0";
import { cacheService } from "./cache.service";

export const executeCode = async (code: string, language: string) => {
  const cacheKey = cacheService.getExecutionCacheKey(code, language);

  //Check cache
  const cached = cacheService.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return {
      ...cached,
      source: "cache",
    };
  }

  console.log(`[EXECUTION] ${language} (cache miss)`);

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

      console.log(`[JUDGE0] ✅ Success`);
      break;
    } catch (err) {
      lastError = err as Error;
      console.warn(`[JUDGE0 RETRY ${i + 1}] ⚠️ Failed: ${lastError.message}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  //If all attempts fail → graceful error response
  if (!result) {
    console.error(`[EXECUTION FAILED] ${lastError?.message}`);

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

  // ✅ Cache only successful results
  cacheService.set(cacheKey, result, 60);
  console.log(`[CACHE SET] ${cacheKey}`);

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