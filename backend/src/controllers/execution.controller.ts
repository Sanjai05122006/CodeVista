import { Request, Response } from "express";
import { executeCode } from "../services/execution.service";

export const runExecution = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        error: "Code and language are required",
      });
    }

    const result = await executeCode(code, language);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};