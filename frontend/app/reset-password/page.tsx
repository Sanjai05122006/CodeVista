"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { StatusCard } from "@/components/ui/StatusCard";

const passwordRequirements = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "One special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const { loading, session, refreshSession } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/login");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [message, router]);

  const allRequirementsMet = useMemo(
    () => passwordRequirements.every((requirement) => requirement.test(password)),
    [password]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!allRequirementsMet) {
      setError(
        "Password must be at least 8 characters and include an uppercase letter, a number, and a special character."
      );
      return;
    }

    try {
      setSubmitting(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Your password has been updated. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("We couldn’t update your password right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canShowForm = !loading && Boolean(session);

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
            <Lock size={20} />
          </div>
          <p className="font-mono-ui mt-4 text-[12px] text-[var(--mute)]">
            New password
          </p>
          <h1 className="font-display mt-3 text-[clamp(1.9rem,7vw,32px)] font-semibold tracking-[-1.28px] text-[var(--ink)]">
            Choose a new password.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-[var(--body)] sm:text-[16px]">
            Set a new password for your account and then return to the sign-in
            page.
          </p>
        </div>

        {loading ? (
          <div className="mt-8">
            <StatusCard
              tone="info"
              title="Checking your reset link..."
              message="We are checking that the password reset link is still valid."
            />
          </div>
        ) : !canShowForm ? (
          <div className="mt-8">
            <StatusCard
              tone="warning"
              title="Reset link expired"
              message="This link is no longer valid. Request a new password reset link to continue."
            />
          </div>
        ) : message ? (
          <div className="mt-8">
            <StatusCard
              tone="success"
              title="Password updated"
              message={
                <span>
                  {message} You will be redirected to sign in shortly.
                </span>
              }
              action={
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-semibold text-[var(--on-primary)] transition hover:opacity-90"
                >
                  Go to sign in now
                </Link>
              }
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--ink)]">
                New password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
                className="h-11 w-full rounded-md border border-[var(--hairline)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--ink)]">
                Confirm password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                className="h-11 w-full rounded-md border border-[var(--hairline)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
              />
            </label>

            <div className="grid gap-2 text-sm text-[var(--body)] sm:grid-cols-2">
              {passwordRequirements.map((requirement) => {
                const matched = requirement.test(password);

                return (
                  <span
                    key={requirement.label}
                    className={matched ? "text-[var(--ink)]" : "text-[var(--mute)]"}
                  >
                    {matched ? "•" : "○"} {requirement.label}
                  </span>
                );
              })}
            </div>

            {error ? (
              <StatusCard
                tone="error"
                compact
                title="Unable to update password"
                message={error}
              />
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
