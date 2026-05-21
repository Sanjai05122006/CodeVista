"use client";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { useAuth } from "@/lib/auth-context";

export function PublicPageFrame({
  children,
  headerVariant = "legacy",
}: {
  children: React.ReactNode;
  headerVariant?: "legacy" | "landing";
}) {
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--canvas-soft)] text-[var(--ink)]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_32%),linear-gradient(180deg,#fafafa_0%,#f5f5f5_50%,#fafafa_100%)]" />
      <LandingHeader user={user} variant={headerVariant} />
      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
