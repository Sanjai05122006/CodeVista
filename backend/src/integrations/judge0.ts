import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const BASE_URL = env.JUDGE0_BASE_URL;

//Language mapping
const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

export const executeJudge0 = async (
  code: string,
  language: string,
  stdin: string = ""
) => {
  const language_id = languageMap[language];

  if (!language_id) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id,
        stdin,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, 
      }
    );

    return response.data;

  } catch (error: any) {
    logger.error("judge0.execution_failed", {
      message: error.message,
      status: error.response?.status,
    });

    throw new Error("Judge0 execution failed");
  }
};

//Fetch supported languages
export const getLanguages = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/languages`, {
      timeout: 5000,
    });

    return response.data;

  } catch (error: any) {
    logger.error("judge0.languages_failed", {
      message: error.message,
    });
    throw new Error("Failed to fetch languages");
  }
};
