"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { StatusCard } from "@/components/ui/StatusCard";

type RegisterFeedback = {
  tone: "success" | "error";
  title: string;
  message: string;
};

const featureItems = [
  {
    icon: BarChart3,
    title: "AI-Powered Analysis",
    description:
      "Generate pseudocode, algorithm steps, and complexity analysis instantly.",
  },
  {
    icon: Boxes,
    title: "Built-in Visualizer",
    description:
      "Visualize code execution with step-by-step flow, variables, and call stack.",
  },
  {
    icon: Shield,
    title: "Secure & Personal",
    description:
      "Your code, history, and sessions are always secure and private.",
  },
];

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export default function RegisterPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<RegisterFeedback | null>(null);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/");
    }
  }, [loading, router, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setFeedback({
        tone: "error",
        title: "Missing details",
        message: "All fields are required.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        tone: "error",
        title: "Passwords do not match",
        message: "Please enter the same password in both fields.",
      });
      return;
    }

    setSubmitting(true);

    try {
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

      if (error) {
        setFeedback({
          tone: "error",
          title: "Registration failed",
          message: error.message,
        });
        return;
      }

      setFeedback({
        tone: "success",
        title: "Account created",
        message:
          "Check your email if confirmation is required. Redirecting you to sign in.",
      });
      await delay(1500);
      router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setFeedback({
          tone: "error",
          title: "Google sign-up failed",
          message: error.message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f6ff] text-slate-950">
      <div className="grid min-h-screen w-full bg-white lg:grid-cols-[1.12fr_0.88fr]">
        <LeftPanel />
        <RightPanel
          confirmPassword={confirmPassword}
          email={email}
          feedback={feedback}
          fullName={fullName}
          onConfirmPasswordChange={setConfirmPassword}
          onEmailChange={setEmail}
          onFullNameChange={setFullName}
          onGoogle={handleGoogleSignup}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          password={password}
          setShowConfirmPassword={setShowConfirmPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          showPassword={showPassword}
          submitting={submitting}
        />
      </div>
    </main>
  );
}

function LeftPanel() {
  return (
    <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#f7f8ff_0%,#f3f4ff_56%,#eef1ff_100%)] px-16 py-14 lg:flex lg:min-h-screen lg:flex-col lg:px-24 lg:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-[#dde1ff]/60 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-6%] h-[20rem] w-[20rem] rounded-full bg-[#e5e8ff]/70 blur-3xl" />
        <svg
          aria-hidden="true"
          viewBox="0 0 900 900"
          className="absolute left-[43%] top-[55%] h-[20rem] w-[31rem] opacity-55"
        >
          <g fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.15">
            <path d="M34 490c120-88 236-88 348 0s226 88 348 0" />
            <path d="M20 522c126-91 248-91 364 0s230 91 356 0" />
            <path d="M10 554c130-93 260-93 380 0s236 93 366 0" />
            <path d="M0 586c134-95 270-95 396 0s242 95 378 0" />
          </g>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <CodeMark />
          <p className="text-[24px] font-semibold tracking-[-0.06em] text-slate-950">
            CodeVista
          </p>
        </div>

        <div className="mt-[15px] max-w-[640px]">
          <h1 className="text-[60px] font-semibold leading-[1.04] tracking-[-0.07em] text-slate-950">
            The modern way
            <br />
            to code and understand.
          </h1>

          <p className="mt-10 max-w-[590px] text-[17px] leading-[1.68] text-slate-600">
            CodeVista helps developers and learners visualize execution,
            analyze complexity, and get AI-powered explanations
            {" "}
            — all in one intelligent IDE.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-14 grid max-w-[650px] gap-7">
        {featureItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-start gap-6">
              <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[18px] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                <Icon className="h-8 w-8 text-slate-950" strokeWidth={2.1} />
              </div>
              <div className="pt-1">
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-[440px] text-[16px] leading-[1.58] text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RightPanel({
  confirmPassword,
  email,
  feedback,
  fullName,
  onConfirmPasswordChange,
  onEmailChange,
  onFullNameChange,
  onGoogle,
  onPasswordChange,
  onSubmit,
  password,
  setShowConfirmPassword,
  setShowPassword,
  showConfirmPassword,
  showPassword,
  submitting,
}: {
  confirmPassword: string;
  email: string;
  feedback: RegisterFeedback | null;
  fullName: string;
  onConfirmPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onGoogle: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  password: string;
  setShowConfirmPassword: (value: boolean) => void;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  showPassword: boolean;
  submitting: boolean;
}) {
  return (
    <section className="flex min-h-screen items-start justify-center overflow-y-auto px-6 py-12 sm:px-10 lg:px-16 lg:py-20">
      <div className="w-full max-w-[440px]">
        <div className="lg:hidden">
          <div className="flex items-center gap-4">
            <CodeMark />
            <p className="text-[24px] font-semibold tracking-[-0.06em] text-slate-950">
              CodeVista
            </p>
          </div>
        </div>

        <div className="pt-2 lg:pt-0">
          <h2 className="text-center text-[42px] font-semibold tracking-[-0.06em] text-slate-950">
            Create your account
          </h2>
          <p className="mt-3 text-center text-[14px] text-[#6b7280]">
            Join CodeVista and get started for free.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={onSubmit}
          >
            <Field label="Full name" icon={<User className="h-5 w-5" />}>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
                className="h-full w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-[#94a3b8]"
              />
            </Field>

            <Field label="Email address" icon={<Mail className="h-5 w-5" />}>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                className="h-full w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-[#94a3b8]"
              />
            </Field>

            <Field
              label="Password"
              icon={<LockKeyhole className="h-5 w-5" />}
              trailing={
                <PasswordToggle
                  onClick={() => setShowPassword(!showPassword)}
                  pressed={showPassword}
                />
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                className="h-full w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-[#94a3b8]"
              />
            </Field>

            <p className="mt-[-1px] text-[14px] text-[#6b7280]">
              At least 8 characters
            </p>

            <Field
              label="Confirm password"
              icon={<LockKeyhole className="h-5 w-5" />}
              trailing={
                <PasswordToggle
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  pressed={showConfirmPassword}
                />
              }
            >
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                className="h-full w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-[#94a3b8]"
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-[58px] w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#0f1726_0%,#060b14_100%)] text-[14px] font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition hover:brightness-110 disabled:opacity-60"
            >
              Create account
            </button>

            <div className="flex items-center gap-4 pt-1 text-[#94a3b8]">
              <div className="h-px flex-1 bg-[#e2e8f0]" />
              <span className="text-[16px]">or</span>
              <div className="h-px flex-1 bg-[#e2e8f0]" />
            </div>

            <button
              type="button"
              onClick={onGoogle}
              disabled={submitting}
              className="flex h-[58px] w-full items-center justify-center gap-3 rounded-[16px] border border-[#d6dbea] bg-white text-[14px] font-medium text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 disabled:opacity-60"
            >
              <GoogleMark />
              Sign up with Google
            </button>

            <p className="sr-only" aria-live="polite">
              {feedback ? `${feedback.title}. ${feedback.message}` : ""}
            </p>

            {feedback ? (
              <div className="pt-2">
                <StatusCard
                  tone={feedback.tone}
                  title={feedback.title}
                  message={feedback.message}
                  compact
                />
              </div>
            ) : null}

            <p className="pt-2 text-center text-[14px] text-[#6b7280]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#1d4ed8] transition hover:opacity-80"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2.5">
      <span className="text-[18px] font-semibold text-slate-950">{label}</span>
      <div className="flex h-[68px] items-center gap-4 rounded-[16px] border border-[#d6dbea] bg-white px-5 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
        <div className="shrink-0 text-[#64748b]">{icon}</div>
        <div className="min-w-0 flex-1">{children}</div>
        {trailing ? <div className="text-[#64748b]">{trailing}</div> : null}
      </div>
    </label>
  );
}

function CodeMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-11 w-11 text-slate-950"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6 2.5 12 8 18" />
      <path d="M16 6 21.5 12 16 18" />
      <path d="M10 20 14 4" />
    </svg>
  );
}

function PasswordToggle({
  pressed,
  onClick,
}: {
  pressed: boolean;
  onClick: () => void;
}) {
  const Icon = pressed ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="rounded-full text-[#64748b] transition hover:text-slate-950"
      aria-label={pressed ? "Hide password" : "Show password"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function GoogleMark() {
  return (
    <Image
      src="/google.svg"
      alt=""
      width={18}
      height={18}
      className="h-[18px] w-[18px] shrink-0"
      unoptimized
    />
  );
}
