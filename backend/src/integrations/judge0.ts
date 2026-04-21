import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.JUDGE0_BASE_URL;

if (!BASE_URL) {
  throw new Error("JUDGE0_BASE_URL is not defined in .env");
}

//Language mapping
const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

export const executeJudge0 = async (code: string, language: string) => {
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
    console.error("JUDGE0 ERROR:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
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
    console.error("JUDGE0 LANGUAGES ERROR:", error.message);
    throw new Error("Failed to fetch languages");
  }
};