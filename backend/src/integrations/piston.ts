import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const PISTON_BASE_URL = env.PISTON_BASE_URL;

const pistonLanguageMap: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  cpp: "cpp",
};

export const executePiston = async (
  code: string,
  language: string,
  stdin: string = ""
) => {
  const pistonLang = pistonLanguageMap[language];

  if (!pistonLang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(
      `${PISTON_BASE_URL}/execute`,
      {
        language: pistonLang,
        version: "*",
        files: [{ name: "main", content: code }],
        stdin,
      },
      {
        timeout: 10000,
      }
    );

    return response.data;

  } catch (error: any) {
    logger.error("piston.execution_failed", {
      message: error.message,
      status: error.response?.status,
    });

    throw error;
  }
};
