"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Code2,
  GitBranch,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";

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
    <main className="h-screen flex overflow-hidden bg-[#f8fafc]">
      {/* LEFT */}
      <div className="w-1/2 px-16 py-12 flex flex-col 
      bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.15),transparent_40%),linear-gradient(135deg,#f8fafc,#eef2ff,#e0e7ff)]">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl 
          bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
          flex items-center justify-center text-white shadow-md">
            <Code2 size={18} />
          </div>
          <span className="text-lg font-semibold text-gray-700">
            CodeVista
          </span>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex items-center">
          <div className="w-full">

            {/* TAG */}
            <span className="text-sm px-4 py-1 
            bg-[#eef2ff] text-[#4f46e5] rounded-full">
              Understand. Visualize. Master.
            </span>

            {/* HEADING */}
            <h1 className="mt-8 text-[52px] leading-[1.1] font-bold tracking-tight">
              <span className="text-[#111827]">Understand code,</span>
              <br />
              <span className="bg-gradient-to-r 
              from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
              bg-clip-text text-transparent">
                not just run it.
              </span>
            </h1>

            {/* DESC */}
            <p className="mt-6 text-gray-500 max-w-sm leading-relaxed">
              CodeVista helps you visualize execution, analyze complexity,
              and truly understand algorithms — all in one place.
            </p>

            {/* FEATURES */}
            <div className="grid gap-6 mt-10">
              <Feature
                icon={<Code2 size={18} />}
                title="Write & Run"
                desc="Code in our smart editor"
              />
              <Feature
                icon={<GitBranch size={18} />}
                title="Visualize"
                desc="Execution flow step by step"
              />
              <Feature
                icon={<Activity size={18} />}
                title="Analyze"
                desc="Time & space complexity"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-1/2 bg-white px-16 py-12 flex items-center">
        <div className="w-full max-w-md mx-auto">

          <h2 className="text-3xl font-semibold text-[#111827]">
            Create your account
          </h2>
          <p className="text-gray-500 mt-2">
            Start your journey with CodeVista
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mt-8 space-y-4">
              <Input
                icon={<User size={18} />}
                placeholder="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
              />
              <Input
                icon={<Mail size={18} />}
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <Input
                icon={<Lock size={18} />}
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Input
                icon={<Lock size={18} />}
                placeholder="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* RULES */}
            <div className="grid grid-cols-2 gap-y-3 mt-6 text-sm text-gray-500">
              <span className="text-[#6366f1]">✔ At least 8 characters</span>
              <span className="text-[#6366f1]">✔ One uppercase letter</span>
              <span className="text-[#6366f1]">✔ One number</span>
              <span className="text-[#6366f1]">✔ One special character</span>
            </div>

            {/* CHECK */}
            <label className="flex gap-2 mt-6 text-sm text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="accent-[#6366f1] w-4 h-4 mt-[2px]"
              />
              <span>
                I agree to the{" "}
                <span className="text-[#6366f1] hover:underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-[#6366f1] hover:underline">
                  Privacy Policy
                </span>
              </span>
            </label>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full py-3 rounded-xl text-white font-medium
              bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
              shadow-[0_15px_40px_rgba(99,102,241,0.35)]
              hover:shadow-[0_20px_50px_rgba(99,102,241,0.45)]
              transition-all disabled:opacity-70"
            >
              Create account
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-6 text-gray-400 text-sm">
            <div className="flex-1 h-px bg-gray-200" />
            or continue with
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={submitting}
            className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 transition disabled:opacity-70"
          >
            <img src="/google.svg" alt="" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="text-[#6366f1] cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

/* FEATURE */
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
    <div className="flex gap-4 items-start">
      <div className="w-11 h-11 rounded-lg 
      bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
      text-white flex items-center justify-center shadow-md">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

/* INPUT */
function Input({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 
    bg-[#f9fafb] border border-gray-200 rounded-xl
    focus-within:border-[#6366f1] 
    focus-within:ring-2 focus-within:ring-[#6366f1]/20 transition">

      <div className="text-gray-400">{icon}</div>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full bg-transparent text-gray-800 
        placeholder:text-gray-400 outline-none text-sm"
      />
    </div>
  );
}
