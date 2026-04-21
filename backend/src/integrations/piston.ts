import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PISTON_BASE_URL = process.env.PISTON_BASE_URL;

const pistonLanguageMap: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  cpp: "cpp",
};

export const executePiston = async (code: string, language: string) => {
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
      },
      {
        timeout: 10000,
      }
    );

    return response.data;

  } catch (error: any) {
    console.error("❌ PISTON ERROR:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw error;
  }
};