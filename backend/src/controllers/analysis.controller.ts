import { Request, Response } from "express";
import { AIServiceError } from "../errors/ai.error";
import { analyzeCode } from "../services/ai.service";
import { logger } from "../utils/logger";

export const runAnalysis = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        error: "Code and language are required",
      });
    }

    const result = await analyzeCode(code, language);

    return res.status(200).json(result);
  } catch (error: any) {
    const status = error instanceof AIServiceError ? error.status : 500;
    const code =
      error instanceof AIServiceError ? error.code : "INTERNAL_ERROR";
    const message =
      error instanceof Error ? error.message : "Unknown analysis error";

    logger.error("analysis.request.failed", {
      status,
      code,
      message,
    });

    return res.status(status).json({
      error: code,
      message,
    });
  }
};
