"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Code2,
  GitBranch,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";

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

export default function RegisterPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, router, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      window.alert("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      window.alert("Passwords do not match.");
      return;
    }

    if (!passwordRequirements.every((requirement) => requirement.test(password))) {
      window.alert(
        "Password must be at least 8 characters and include an uppercase letter, a number, and a special character."
      );
      return;
    }

    if (!agreedToTerms) {
      window.alert("You need to accept the terms to continue.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSubmitting(false);

    if (error) {
      window.alert(error.message);
      return;
    }

    window.alert("Account created. Check your email if confirmation is required.");
    router.replace("/login");
  };

  const handleGoogleSignup = async () => {
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
            Create an account
          </p>
          <h1 className="font-display mt-5 text-[48px] font-semibold tracking-[-2.4px] text-[var(--ink)]">
            Start understanding code with more clarity.
          </h1>
          <p className="mt-6 max-w-md text-[18px] leading-8 text-[var(--body)]">
            Build your workspace, save progress across sessions, and keep
            execution, analysis, and learning history together.
          </p>

          <div className="mt-10 grid gap-6">
            <Feature
              icon={<Code2 size={18} />}
              title="Write and run"
              desc="Use one workspace for code, output, and explanation."
            />
            <Feature
              icon={<GitBranch size={18} />}
              title="Follow the logic"
              desc="Replay execution and revisit earlier learning sessions."
            />
            <Feature
              icon={<Activity size={18} />}
              title="Learn with context"
              desc="Keep analysis, history, and questions tied to the same work."
            />
          </div>
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

          <p className="font-mono-ui text-[12px] text-[var(--mute)]">Register</p>
          <h2 className="font-display mt-3 text-[32px] font-semibold tracking-[-1.28px] text-[var(--ink)]">
            Create your workspace.
          </h2>
          <p className="mt-3 text-[16px] leading-7 text-[var(--body)]">
            Set up your account to save sessions and continue learning over time.
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="grid gap-4">
              <InputField
                label="Full name"
                icon={<User size={18} />}
                placeholder="Enter your name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
              />
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
                placeholder="Create a password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <InputField
                label="Confirm password"
                icon={<Lock size={18} />}
                placeholder="Confirm your password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="mt-6 grid gap-3 text-sm text-[var(--body)] sm:grid-cols-2">
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

            <label className="mt-6 flex gap-3 text-sm text-[var(--body)]">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#171717]"
              />
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90 disabled:opacity-60"
            >
              Create account
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-sm text-[var(--mute)]">
            <div className="h-px flex-1 bg-[var(--hairline)]" />
            or continue with
            <div className="h-px flex-1 bg-[var(--hairline)]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[100px] border border-[var(--hairline)] bg-white px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)] disabled:opacity-60"
          >
            <Image src="/google.svg" alt="" width={18} height={18} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-[var(--body)]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-[var(--ink)] underline underline-offset-4"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--hairline)] bg-white text-[var(--ink)] cv-shadow-sm">
        {icon}
      </div>
      <div>
        <p className="font-display text-[20px] font-semibold tracking-[-0.6px] text-[var(--ink)]">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--body)]">{desc}</p>
      </div>
    </div>
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
