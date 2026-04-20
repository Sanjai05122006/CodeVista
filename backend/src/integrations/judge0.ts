import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.JUDGE0_BASE_URL;

// 🔥 Language mapping (can later fetch dynamically)
const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

export const executeJudge0 = async (code: string, language: string) => {
  const language_id = languageMap[language];

  if (!language_id) {
    throw new Error("Unsupported language");
  }

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
    }
  );

  return response.data;
};

// 🔥 Fetch languages
export const getLanguages = async () => {
  const response = await axios.get(`${BASE_URL}/languages`);
  return response.data;
};