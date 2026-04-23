"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Code2 } from "lucide-react";
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
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 relative px-8 xl:px-16 py-10 xl:py-12 flex-col
      bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#e0e7ff]">

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

        {/* CONTENT */}
        <div className="flex-1 flex items-center">
          <div>

            <span className="text-sm px-4 py-1 
            bg-[#eef2ff] text-[#4f46e5] rounded-full">
              Welcome back!
            </span>

            <h1 className="mt-6 xl:mt-8 text-3xl sm:text-4xl xl:text-[52px] 
            leading-tight font-bold tracking-tight">
              <span className="text-[#111827]">Continue your</span>
              <br />
              <span className="bg-gradient-to-r 
              from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
              bg-clip-text text-transparent">
                learning
              </span>{" "}
              <span className="text-[#111827]">journey.</span>
            </h1>

            <p className="mt-4 xl:mt-6 text-gray-500 max-w-md text-sm sm:text-base">
              Access your saved sessions, visualizations,
              and insights — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 bg-[#f9fafb] px-6 sm:px-10 md:px-16 py-10 flex items-center">
        <div className="w-full max-w-md mx-auto">

          {/* MOBILE LOGO */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl 
            bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
            flex items-center justify-center text-white">
              <Code2 size={16} />
            </div>
            <span className="text-base font-semibold text-gray-700">
              CodeVista
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-[#111827]">
            Sign in to CodeVista
          </h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mt-6 sm:mt-8 space-y-4">
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
                autoComplete="current-password"
              />
            </div>

            <div className="flex justify-between items-center mt-5 text-sm">
              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" className="accent-[#6366f1]" />
                Remember me
              </label>

              <span className="text-[#6366f1] cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full py-3 rounded-xl text-white font-medium
              bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5]
              shadow-md hover:opacity-95 transition disabled:opacity-70"
            >
              Sign in
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
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full border border-gray-200 rounded-xl py-3 
          flex items-center justify-center gap-2 text-gray-700 
          hover:bg-gray-50 transition disabled:opacity-70"
          >
            <img src="/google.svg" alt="" className="w-5 h-5" />
            Continue with Google
          </button>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/register")}
              className="text-[#6366f1] cursor-pointer hover:underline"
            >
              Create account
            </span>
          </p>
        </div>
      </div>
    </main>
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
    bg-white border border-gray-200 rounded-xl
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
