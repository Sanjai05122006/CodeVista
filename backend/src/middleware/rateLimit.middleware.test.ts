import assert from "node:assert/strict";
import express from "express";
import {
  __testing__,
  createRateLimitMiddleware,
  MAX_ALGORITHM_NAME_LENGTH,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_CODE_LENGTH,
  MAX_JSON_BODY_SIZE,
  validateChatBatchRequest,
  validateChatRequest,
  validateExecutionRequest,
  validateSessionSaveRequest,
} from "./rateLimit.middleware";
import { errorHandler } from "./error.middleware";

const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: MAX_JSON_BODY_SIZE }));
  app.use((req, _res, next) => {
    const authHeader = req.header("Authorization");
    if (authHeader === "Bearer auth-user") {
      req.user = {
        id: "user-1",
        email: "user@example.com",
      };
    }
    next();
  });

  app.post(
    "/execution",
    createRateLimitMiddleware({
      name: "test-execution",
      anonymousLimit: 2,
      authenticatedLimit: 4,
      windowMs: 60_000,
    }),
    validateExecutionRequest,
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  app.post(
    "/chat",
    createRateLimitMiddleware({
      name: "test-chat",
      anonymousLimit: 2,
      authenticatedLimit: 3,
      windowMs: 60_000,
    }),
    validateChatRequest,
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  app.post("/chat/batch", validateChatBatchRequest, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.post("/session/save", validateSessionSaveRequest, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use(errorHandler);
  return app;
};

const request = async (
  baseUrl: string,
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
};

const run = async () => {
  __testing__.resetRateLimitBuckets();
  const app = createTestApp();
  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("TEST_SERVER_ADDRESS_UNAVAILABLE");
    }

    const baseUrl = `http://127.0.0.1:${address.port}`;

    const anonymousOne = await request(baseUrl, "/execution", {
      code: "console.log(1)",
      language: "javascript",
    });
    const anonymousTwo = await request(baseUrl, "/execution", {
      code: "console.log(2)",
      language: "javascript",
    });
    const anonymousThree = await request(baseUrl, "/execution", {
      code: "console.log(3)",
      language: "javascript",
    });

    assert.equal(anonymousOne.status, 200);
    assert.equal(anonymousTwo.status, 200);
    assert.equal(anonymousThree.status, 429);
    assert.equal(anonymousThree.data?.error, "RATE_LIMIT_EXCEEDED");
    assert.equal(anonymousThree.headers.get("retry-after"), "60");

    const authenticatedStatuses: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      const response = await request(
        baseUrl,
        "/chat",
        {
          message: `Need help ${index}`,
          history: [],
        },
        {
          Authorization: "Bearer auth-user",
        }
      );
      authenticatedStatuses.push(response.status);
    }

    assert.deepEqual(authenticatedStatuses, [200, 200, 200, 429, 429]);

    __testing__.resetRateLimitBuckets();

    const oversizedCode = await request(baseUrl, "/execution", {
      code: "x".repeat(MAX_CODE_LENGTH + 1),
      language: "javascript",
    });
    assert.equal(oversizedCode.status, 413);
    assert.equal(oversizedCode.data?.error, "PAYLOAD_TOO_LARGE");

    const invalidHistory = await request(baseUrl, "/chat", {
      message: "hello",
      history: [{ role: "system", content: "bad" }],
    });
    assert.equal(invalidHistory.status, 400);
    assert.equal(invalidHistory.data?.error, "INVALID_REQUEST_BODY");

    const oversizedMessage = await request(baseUrl, "/chat", {
      message: "m".repeat(MAX_CHAT_MESSAGE_LENGTH + 1),
      history: [],
    });
    assert.equal(oversizedMessage.status, 413);
    assert.equal(oversizedMessage.data?.error, "PAYLOAD_TOO_LARGE");

    const missingThreadReference = await request(baseUrl, "/chat/batch", {
      title: "Thread title",
      messages: [
        {
          role: "user",
          content: "hello",
          sequence: 1,
        },
      ],
    });
    assert.equal(missingThreadReference.status, 400);
    assert.equal(missingThreadReference.data?.error, "INVALID_REQUEST_BODY");

    const oversizedBodyResponse = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "hello",
        history: [],
        context: {
          payload: "z".repeat(70 * 1024),
        },
      }),
    });
    const oversizedBodyData = (await oversizedBodyResponse.json()) as Record<
      string,
      unknown
    >;
    assert.equal(oversizedBodyResponse.status, 413);
    assert.equal(oversizedBodyData.error, "PAYLOAD_TOO_LARGE");

    const validSessionSave = await request(baseUrl, "/session/save", {
      title: "Binary Search",
      executions: [
        {
          code: "console.log(1)",
          language: "javascript",
          ai: {
            algorithmName: "Binary Search",
            pseudocode: ["1. Start"],
            algorithmSteps: ["1. Inspect the midpoint."],
            explanation: "A concise explanation.",
            complexity: {
              time: {
                best: "O(1)",
                average: "O(log n)",
                worst: "O(log n)",
              },
              space: "O(1)",
            },
            trace: [],
          },
        },
      ],
    });
    assert.equal(validSessionSave.status, 200);

    const invalidAlgorithmName = await request(baseUrl, "/session/save", {
      executions: [
        {
          code: "console.log(1)",
          language: "javascript",
          ai: {
            algorithmName: "a".repeat(MAX_ALGORITHM_NAME_LENGTH + 1),
          },
        },
      ],
    });
    assert.equal(invalidAlgorithmName.status, 413);
    assert.equal(invalidAlgorithmName.data?.error, "PAYLOAD_TOO_LARGE");

    console.log("rateLimit.middleware tests passed");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
