"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(session ? "/" : "/login");
    }
  }, [loading, router, session]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas-soft)] px-6">
      <div className="rounded-2xl border border-[var(--hairline)] bg-white px-8 py-6 text-center shadow-sm">
        <p className="text-sm font-medium text-[var(--ink)]">Completing sign in...</p>
        <p className="mt-2 text-sm text-[var(--body)]">
          Please wait while we restore your session.
        </p>
      </div>
    </main>
  );
}
