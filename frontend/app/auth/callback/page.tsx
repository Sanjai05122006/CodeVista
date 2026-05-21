"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionSafely } from "@/lib/auth-session";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    void getSessionSafely().then(({ session }) => {
      if (!mounted) {
        return;
      }

      router.replace(session ? "/" : "/login");
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--canvas-soft)] text-sm text-[var(--body)]">
      Completing sign in...
    </main>
  );
}
