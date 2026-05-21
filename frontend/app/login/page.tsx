"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, router, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      window.alert("Email and password are required.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    router.replace("/");
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSubmitting(false);

    if (error) {
      window.alert(error.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[var(--canvas-soft)] lg:flex-row">
      <section className="cv-mesh-gradient hidden lg:flex lg:w-1/2 lg:flex-col lg:px-16 lg:py-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--hairline)] bg-white text-[var(--ink)] cv-shadow-sm">
            <Code2 size={18} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-[-0.54px] text-[var(--ink)]">
              CodeVista
            </p>
            <p className="font-mono-ui text-[12px] text-[var(--mute)]">
              developer intelligence
            </p>
          </div>
        </Link>

        <div className="max-w-xl pt-16">
          <p className="font-mono-ui text-[12px] text-[var(--mute)]">
            Welcome back
          </p>
          <h1 className="font-display mt-5 text-[48px] font-semibold tracking-[-2.4px] text-[var(--ink)]">
            Continue learning with less friction.
          </h1>
          <p className="mt-6 max-w-md text-[18px] leading-8 text-[var(--body)]">
            Reopen your workspace, revisit saved sessions, and keep your code,
            analysis, and progress in one place.
          </p>
        </div>
      </section>

      <section className="flex w-full items-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--hairline)] bg-white text-[var(--ink)] cv-shadow-sm">
              <Code2 size={18} />
            </div>
            <div>
              <p className="font-display text-base font-semibold tracking-[-0.48px] text-[var(--ink)]">
                CodeVista
              </p>
              <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                developer intelligence
              </p>
            </div>
          </Link>

          <p className="font-mono-ui text-[12px] text-[var(--mute)]">Sign in</p>
          <h2 className="font-display mt-3 text-[32px] font-semibold tracking-[-1.28px] text-[var(--ink)]">
            Access your workspace.
          </h2>
          <p className="mt-3 text-[16px] leading-7 text-[var(--body)]">
            Enter your details to continue where you left off.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid gap-4">
              <InputField
                label="Email address"
                icon={<Mail size={18} />}
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <InputField
                label="Password"
                icon={<Lock size={18} />}
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-[var(--body)]">
                <input type="checkbox" className="h-4 w-4 accent-[#171717]" />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-[var(--body)] underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-60"
            >
              Sign in
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-sm text-[var(--mute)]">
            <div className="h-px flex-1 bg-[var(--hairline)]" />
            or continue with
            <div className="h-px flex-1 bg-[var(--hairline)]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[100px] border border-[var(--hairline)] bg-white px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)] disabled:opacity-60"
          >
            <Image src="/google.svg" alt="" width={18} height={18} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-[var(--body)]">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-[var(--ink)] underline underline-offset-4"
            >
              Create account
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function InputField({
  label,
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      <div className="flex items-center gap-3 rounded-md border border-[var(--hairline)] bg-white px-4 py-3 transition focus-within:border-[var(--ink)]">
        <div className="text-[var(--mute)]">{icon}</div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--mute)]"
        />
      </div>
    </label>
  );
}
