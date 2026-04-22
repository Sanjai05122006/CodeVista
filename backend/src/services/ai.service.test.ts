import assert from "node:assert/strict";
import { AIServiceError } from "../errors/ai.error";
import {
  analyzeCode,
  buildPrompt,
  getAnalysisCacheKey,
  PROMPT_VERSION,
} from "./ai.service";
import {
  extractArray,
  normalizeAnalysis,
  normalizeSpaceComplexity,
  normalizeTimeComplexity,
  safeParse,
} from "../utils/analysis-normalizer";

const run = async () => {
  assert.deepEqual(extractArray({ algorithm_steps: ["a", "b", 1] }, "algorithm_steps"), [
    "a",
    "b",
  ]);

  assert.deepEqual(normalizeTimeComplexity("O(1)"), {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  });

  assert.deepEqual(
    normalizeTimeComplexity({
      average: "O(n)",
    }),
    {
      best: "O(?)",
      average: "O(n)",
      worst: "O(?)",
    }
  );

  assert.equal(normalizeSpaceComplexity("O(n)"), "O(n)");
  assert.equal(normalizeSpaceComplexity(null), "O(?)");

  assert.deepEqual(
    safeParse('```json {"algorithm_steps":["Step 1"]} ```'),
    { algorithm_steps: ["Step 1"] }
  );

  const normalized = normalizeAnalysis({
    pseudocode: [
      "1. SET value = 5",
      "2. OUTPUT value",
      "3. RETURN",
    ],
    algorithm_steps: [
      "1. Initialize a constant value.",
      "2. Print the value.",
      "3. Finish execution.",
    ],
    time_complexity: "O(1)",
    space_complexity: "O(1)",
    explanation:
      "The algorithm stores a constant value. It outputs that value directly. The work does not scale with input size.",
  });

  assert.deepEqual(normalized.time_complexity, {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  });

  const responses = [
    "{\"pseudocode\":[\"1. SET i = 0\",\"2. RETURN i\"],\"algorithm_steps\":[\"1. Initialize i.\",\"2. Return i.\"],\"time_complexity\":\"O(n)\",\"space_complexity\":\"O(1)\"}",
    JSON.stringify({
      pseudocode: [
        "1. SET value = 5",
        "2. OUTPUT value",
        "3. RETURN",
      ],
      algorithm_steps: [
        "1. Store the constant value.",
        "2. Output the stored value.",
        "3. End execution.",
      ],
      time_complexity: {
        best: "O(1)",
        average: "O(1)",
        worst: "O(1)",
      },
      space_complexity: "O(1)",
    }),
  ];

  let getCalls = 0;
  const cache = new Map<string, unknown>();
  const providerCalls: string[] = [];

  const result = await analyzeCode("console.log(5)", "javascript", {
    provider: async (prompt) => {
      providerCalls.push(prompt);
      return responses.shift() as string;
    },
    cache: {
      get: (key: string) => {
        getCalls += 1;
        return (cache.get(key) as any) || null;
      },
      set: (key: string, value: unknown) => {
        cache.set(key, value);
      },
    },
  });

  assert.equal(getCalls, 1);
  assert.equal(providerCalls.length, 1);
  assert.equal(result.source, "gemini");
  assert.equal(cache.size, 1);
  assert.deepEqual(result.algorithm_steps, [
    "1. Initialize i.",
    "2. Return i.",
  ]);

  const fallbackResult = await analyzeCode("broken", "javascript", {
    provider: async () => "not-json",
    cache: {
      get: () => null,
      set: () => undefined,
    },
  });

  assert.equal(fallbackResult.time_complexity.best, "N/A");
  assert.deepEqual(fallbackResult.algorithm_steps, []);

  const groqFallbackResult = await analyzeCode("return 1", "javascript", {
    providers: [
      {
        name: "gemini",
        provider: async () => {
          throw new AIServiceError(
            "AI_NETWORK_ERROR",
            "status 429: gemini busy",
            429
          );
        },
      },
      {
        name: "groq",
        provider: async () =>
          JSON.stringify({
            pseudocode: ["1. RETURN result"],
            algorithm_steps: ["1. Use Groq fallback."],
            time_complexity: "O(1)",
            space_complexity: "O(1)",
          }),
      },
    ],
    cache: {
      get: () => null,
      set: () => undefined,
    },
  });

  assert.equal(groqFallbackResult.source, "groq");

  const key = getAnalysisCacheKey("console.log(2+3)", "javascript");
  const comparison = getAnalysisCacheKey(
    "console.log(2+3)",
    "javascript",
    `${PROMPT_VERSION}-next`
  );

  assert.notEqual(key, comparison);

  const prompt = buildPrompt("console.log(2+3)", "javascript");

  assert.match(prompt, /Language: javascript/);
  assert.match(prompt, /console\.log\(2\+3\)/);

  console.log("ai.service tests passed");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
