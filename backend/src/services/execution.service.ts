import { executeJudge0 } from "../integrations/judge0";

export const executeCode = async (code: string, language: string) => {
  const result = await executeJudge0(code, language);

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || result.compile_output || "",
    runtime_ms: Number(result.time) * 1000 || 0,
    memory_kb: result.memory || 0,
    status: result.status?.description || "Unknown",
  };
};