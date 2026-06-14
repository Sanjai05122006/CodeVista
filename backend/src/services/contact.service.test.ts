import assert from "node:assert/strict";
import app from "../app";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";
import {
  recordContactSubmissionLog,
  sendContactSubmissionMessage,
} from "./contact.service";

type LoggedEntry = {
  level: "info" | "warn";
  message: string;
  meta?: Record<string, unknown>;
};

const createServer = () => app.listen(0);

const closeServer = async (server: ReturnType<typeof createServer>) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const run = async () => {
  const mutableLogger = logger as unknown as {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };

  const originalLoggerInfo = mutableLogger.info;
  const originalLoggerWarn = mutableLogger.warn;
  const originalFetch = globalThis.fetch.bind(globalThis);
  const expectedRecipient =
    process.env.CONTACT_TO_EMAIL?.trim() || "delivered@resend.dev";

  const logs: LoggedEntry[] = [];
  let resendMode: "success" | "failure" = "success";

  mutableLogger.info = (message, meta) => {
    logs.push({ level: "info", message, meta });
  };

  mutableLogger.warn = (message, meta) => {
    logs.push({ level: "warn", message, meta });
  };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url === "https://api.resend.com/emails") {
      if (resendMode === "success") {
        return jsonResponse({ id: "mock-resend-message-id" }, 200);
      }

      return jsonResponse(
        {
          name: "provider_error",
          message: "Provider unavailable.",
        },
        502
      );
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  try {
    // recordContactSubmissionLog — success path
    const successResult = await recordContactSubmissionLog(
      {
        status: "success",
        subject: "CodeVista support",
        message_length: 34,
        provider_status: 200,
        provider_message: "Message sent.",
      },
      {
        requestOrigin: "http://127.0.0.1:3001",
        requestIp: "127.0.0.1",
      }
    );

    assert.equal(successResult.ok, true);
    assert.ok(
      logs.some((entry) => entry.message === "contact.message.delivered")
    );
    assert.equal(logs[0]?.level, "info");
    assert.equal(logs[0]?.meta?.status, "success");
    assert.equal(logs[0]?.meta?.subject, "CodeVista support");
    assert.equal(logs[0]?.meta?.message_length, 34);
    assert.equal(logs[0]?.meta?.recipient, undefined);

    logs.length = 0;

    const server = createServer();

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("TEST_SERVER_ADDRESS_UNAVAILABLE");
      }

      // /api/contact/log HTTP endpoint
      const logResponse = await originalFetch(
        `http://127.0.0.1:${address.port}/api/contact/log`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://127.0.0.1:3001",
          },
          body: JSON.stringify({
            status: "error",
            subject: "Billing question",
            message_length: 21,
            provider_status: 401,
            provider_message: "Invalid access key",
            error_code: "RESEND_SEND_FAILED",
          }),
        }
      );

      const logData = (await logResponse.json()) as {
        ok: boolean;
      };

      assert.equal(logResponse.status, 200);
      assert.equal(logData.ok, true);
      assert.ok(
        logs.some((entry) => entry.message === "contact.message.delivery_failed")
      );
      assert.equal(logs[0]?.level, "warn");
      assert.equal(logs[0]?.meta?.status, "error");
      assert.equal(logs[0]?.meta?.provider_status, 401);

      logs.length = 0;

      // sendContactSubmissionMessage — success path
      const submitResult = await sendContactSubmissionMessage(
        {
          name: "Example User",
          email: "user@example.com",
          subject: "Feature request",
          message: "Please add a dark theme toggle.",
        },
        {
          requestOrigin: "http://127.0.0.1:3001",
          requestIp: "127.0.0.1",
        }
      );

      assert.equal(submitResult.messageId, "mock-resend-message-id");
      assert.equal(submitResult.providerStatus, 200);
      assert.equal(submitResult.recipient, expectedRecipient);
      assert.ok(
        logs.some(
          (entry) =>
            entry.message === "contact.message.delivered" &&
            entry.level === "info" &&
            entry.meta?.status === "success" &&
            entry.meta?.recipient === expectedRecipient
        )
      );

      logs.length = 0;

      // /api/contact/send HTTP endpoint — success path
      const sendResponse = await originalFetch(
        `http://127.0.0.1:${address.port}/api/contact/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://127.0.0.1:3001",
          },
          body: JSON.stringify({
            name: "Example User",
            email: "user@example.com",
            subject: "Feature request",
            message: "Please add a dark theme toggle.",
          }),
        }
      );

      const sendData = (await sendResponse.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        message_id?: string;
        provider_status?: number;
      };

      assert.equal(sendResponse.status, 200);
      assert.equal(sendData.ok, true);
      assert.equal(sendData.message, "Your message was sent successfully.");
      assert.equal(sendData.message_id, "mock-resend-message-id");
      assert.equal(sendData.provider_status, 200);
      assert.ok(
        logs.some(
          (entry) =>
            entry.message === "contact.message.delivered" &&
            entry.level === "info" &&
            entry.meta?.status === "success" &&
            entry.meta?.recipient === expectedRecipient
        )
      );

      logs.length = 0;

      resendMode = "failure";

      // sendContactSubmissionMessage — failure path
      await assert.rejects(
        () =>
          sendContactSubmissionMessage(
            {
              name: "Example User",
              email: "user@example.com",
              subject: "Feature request",
              message: "Please add a dark theme toggle.",
            },
            {
              requestOrigin: "http://127.0.0.1:3001",
              requestIp: "127.0.0.1",
            }
          ),
        (error: unknown) =>
          error instanceof AppError &&
          error.code === "CONTACT_EMAIL_SEND_FAILED"
      );

      assert.ok(
        logs.some(
          (entry) =>
            entry.message === "contact.message.delivery_failed" &&
            entry.level === "warn" &&
            entry.meta?.error_code === "RESEND_SEND_FAILED" &&
            entry.meta?.provider_error_name === "provider_error" &&
            entry.meta?.failure_reason === "provider_http_error" &&
            entry.meta?.recipient === expectedRecipient
        )
      );

      logs.length = 0;

      // /api/contact/send HTTP endpoint — failure path
      const failureResponse = await originalFetch(
        `http://127.0.0.1:${address.port}/api/contact/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://127.0.0.1:3001",
          },
          body: JSON.stringify({
            name: "Example User",
            email: "user@example.com",
            subject: "Feature request",
            message: "Please add a dark theme toggle.",
          }),
        }
      );

      const failureData = (await failureResponse.json()) as {
        error?: string;
        message?: string;
      };

      assert.equal(failureResponse.status, 502);
      assert.equal(failureData.error, "CONTACT_EMAIL_SEND_FAILED");
      assert.equal(
        failureData.message,
        "Unable to send your message right now."
      );
      assert.ok(
        logs.some(
          (entry) =>
            entry.message === "contact.message.delivery_failed" &&
            entry.level === "warn" &&
            entry.meta?.error_code === "RESEND_SEND_FAILED" &&
            entry.meta?.provider_error_name === "provider_error" &&
            entry.meta?.failure_reason === "provider_http_error" &&
            entry.meta?.recipient === expectedRecipient
        )
      );
    } finally {
      await closeServer(server);
    }
  } finally {
    globalThis.fetch = originalFetch;
    mutableLogger.info = originalLoggerInfo;
    mutableLogger.warn = originalLoggerWarn;
  }

  console.log("contact.service tests passed");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
