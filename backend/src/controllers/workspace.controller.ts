import { Request, Response } from "express";
import { executeCode } from "../services/execution.service";
import { analyzeCode } from "../services/ai.service";

export const runWorkspace = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        error: "Code and language are required",
      });
    }

    const [execution, analysis] = await Promise.all([
      executeCode(code, language),
      analyzeCode(code, language),
    ]);

    return res.status(200).json({
      execution,
      analysis,
      trace: analysis.execution_trace || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "WORKSPACE_REQUEST_FAILED",
    });
  }
};
