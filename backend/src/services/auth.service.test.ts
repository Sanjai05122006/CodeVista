import assert from "node:assert/strict";
import app from "../app";
import { db, supabaseAdmin } from "../config/db";
import { env } from "../config/env";
import { resolveTrustedFrontendOrigin } from "../utils/frontend-origins";
import { sendPasswordResetEmail } from "./auth.service";

const createServer = () => app.listen(0);

const run = async () => {
  assert.equal(
    resolveTrustedFrontendOrigin("http://127.0.0.1:3001"),
    "http://127.0.0.1:3001"
  );
  assert.equal(
    resolveTrustedFrontendOrigin("http://localhost:3001"),
    "http://localhost:3001"
  );

  const mutableDb = db as unknown as {
    query: (...args: [string, unknown[]]) => Promise<{ rows: Array<{ id: string }> }>;
  };
  const mutableSupabaseAuth = supabaseAdmin.auth as unknown as {
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string }
    ) => Promise<{
      error: { message: string; status?: number } | null;
    }>;
  };

  const originalDbQuery = mutableDb.query;
  const originalResetPasswordForEmail = mutableSupabaseAuth.resetPasswordForEmail;
  const originalFrontendUrl = env.FRONTEND_URL;

  let dbQueryCalls = 0;
  let resetPasswordCalls = 0;
  let capturedRedirectTo = "";

  try {
    env.FRONTEND_URL = "http://localhost:3000";

    mutableDb.query = async () => {
      dbQueryCalls += 1;
      return {
        rows: [{ id: "user-1" }],
      };
    };

    mutableSupabaseAuth.resetPasswordForEmail = async (_email, options) => {
      resetPasswordCalls += 1;
      capturedRedirectTo = options.redirectTo;
      return {
        error: null,
      };
    };

    const server = createServer();

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("TEST_SERVER_ADDRESS_UNAVAILABLE");
      }

      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/auth/password/reset/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://127.0.0.1:3001",
          },
          body: JSON.stringify({ email: "student@example.com" }),
        }
      );

      const data = (await response.json()) as {
        ok: boolean;
        message: string;
      };

      assert.equal(response.status, 200);
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "http://127.0.0.1:3001"
      );
      assert.equal(data.ok, true);
      assert.equal(
        data.message,
        "If that email is registered, a password reset link has been sent."
      );
      assert.equal(capturedRedirectTo, "http://127.0.0.1:3001/reset-password");
      assert.equal(dbQueryCalls, 1);
      assert.equal(resetPasswordCalls, 1);
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

    capturedRedirectTo = "";
    resetPasswordCalls = 0;

    mutableDb.query = async () => {
      dbQueryCalls += 1;
      return {
        rows: [],
      };
    };

    await sendPasswordResetEmail("missing@example.com", {
      requestOrigin: "http://127.0.0.1:3001",
    });

    assert.equal(resetPasswordCalls, 0);
    assert.equal(capturedRedirectTo, "");

    env.FRONTEND_URL = "http://localhost:3000";

    mutableDb.query = async () => {
      dbQueryCalls += 1;
      return {
        rows: [{ id: "user-2" }],
      };
    };

    await sendPasswordResetEmail("student@example.com");

    assert.equal(capturedRedirectTo, "http://localhost:3000/reset-password");
  } finally {
    mutableDb.query = originalDbQuery;
    mutableSupabaseAuth.resetPasswordForEmail = originalResetPasswordForEmail;
    env.FRONTEND_URL = originalFrontendUrl;
  }

  console.log("auth.service tests passed");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
