import axios from "axios";
import { env } from "../config/env";
import { AIServiceError } from "../errors/ai.error";
import { logger } from "../utils/logger";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const generateGeminiAnalysis = async (
  prompt: string
): Promise<string> => {
  const startedAt = Date.now();

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          topP: 0.1,
          topK: 1,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

        const rawText =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        // 🔍 RAW RESPONSE DEBUG (DEV ONLY)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n================= GEMINI RAW RESPONSE =================");
      console.log(rawText);
      console.log("=======================================================\n");
    }

    // 📊 STRUCTURED PREVIEW LOG (SAFE FOR PROD)
    logger.info("gemini.raw_response", {
      preview: rawText?.slice(0, 300), // first 300 chars
      length: rawText?.length,
    });

    if (!rawText || typeof rawText !== "string") {
      throw new AIServiceError(
        "AI_PROVIDER_ERROR",
        "Gemini returned an empty response"
      );
    }

    logger.info("gemini.response.received", {
      provider: "gemini",
      model: GEMINI_MODEL,
      latency_ms: Date.now() - startedAt,
    });

    return rawText;
  } catch (error: any) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    const isTimeout = error.code === "ECONNABORTED";
    const status = error.response?.status;
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Gemini request failed";

    logger.error("gemini.response.failed", {
      provider: "gemini",
      model: GEMINI_MODEL,
      latency_ms: Date.now() - startedAt,
      error_code: error.code,
      status,
      message,
    });

    throw new AIServiceError(
      isTimeout ? "AI_TIMEOUT_ERROR" : "AI_NETWORK_ERROR",
      status ? `status ${status}: ${message}` : message,
      status || 502
    );
  }
};
