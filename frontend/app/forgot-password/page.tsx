"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/api";
import { StatusCard } from "@/components/ui/StatusCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestPasswordReset(email.trim());
      setMessage(
        response.message ||
          "If that email is registered, a password reset link has been sent."
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to request password reset."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas-soft)] px-6 py-10">
      <section className="cv-shadow-lg w-full max-w-xl rounded-2xl border border-[var(--hairline)] bg-white p-8 lg:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-[var(--body)]"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
            <Mail size={20} />
          </div>
          <p className="font-mono-ui mt-4 text-[12px] text-[var(--mute)]">
            Password reset
          </p>
          <h1 className="font-display mt-3 text-[32px] font-semibold tracking-[-1.28px] text-[var(--ink)]">
            Reset your password.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[16px] leading-7 text-[var(--body)]">
            Enter the email address you use for CodeVista and we will send you a
            reset link.
          </p>
        </div>

        {message ? (
          <div className="mt-8">
            <StatusCard
              tone="success"
              title="Reset link sent."
              message={
                <span>
                  {message} Check your inbox and open the link to continue.
                </span>
              }
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--ink)]">
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="h-11 w-full rounded-md border border-[var(--hairline)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
              />
            </label>

            {error ? (
              <StatusCard
                tone="error"
                compact
                title="Unable to continue"
                message={error}
              />
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Checking account..." : "Send reset link"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
