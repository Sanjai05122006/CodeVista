import axios from "axios";
import { env } from "../config/env";
import { AIServiceError } from "../errors/ai.error";
import { logger } from "../utils/logger";

const GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const generateGroqAnalysis = async (
  prompt: string
): Promise<string> => {
  if (!env.GROQ_API_KEY) {
    throw new AIServiceError(
      "AI_PROVIDER_ERROR",
      "GROQ_API_KEY is not configured"
    );
  }

  const startedAt = Date.now();

  try {
    const response = await axios.post(
      GROQ_ENDPOINT,
      {
        model: GROQ_MODEL,
        temperature: 0,
        top_p: 0.1,
        stream: false,
        messages: [
        { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    logger.info("groq.full_response", {
  data: response.data,
});
    const rawText = response.data?.choices?.[0]?.message?.content;

    logger.info("groq.raw_response", {
      preview: rawText?.slice(0, 300),
      length: rawText?.length,
    });

    if (!rawText || typeof rawText !== "string") {
      throw new AIServiceError(
        "AI_PROVIDER_ERROR",
        "Groq returned an empty response"
      );
    }

    logger.info("groq.response.received", {
      provider: "groq",
      model: GROQ_MODEL,
      latency_ms: Date.now() - startedAt,
    });

    return rawText;
  } catch (error: any) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    const isTimeout = error.code === "ECONNABORTED";
    const status = error.response?.status;
    const errorData = error.response?.data;
    const message =
      errorData?.error?.message || error.message || "Groq request failed";

    logger.error("groq.response.failed", {
  provider: "groq",
  model: GROQ_MODEL,
  latency_ms: Date.now() - startedAt,
  error_code: error.code,
  status,
  message,
  response_data: errorData,

  // 🔥 ADD THESE
  full_error: {
    code: error.code,
    message: error.message,
    stack: error.stack,
  },
});

    throw new AIServiceError(
      isTimeout ? "AI_TIMEOUT_ERROR" : "AI_NETWORK_ERROR",
      status ? `status ${status}: ${message}` : message,
      status || 502,

      
    );
  }
};

