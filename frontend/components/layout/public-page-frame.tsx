"use client";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { useAuth } from "@/lib/auth-context";

export function PublicPageFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8fafc] text-[#111827]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)]" />
      <LandingHeader user={user} />
      <div className="flex-1">{children}</div>
      <LandingFooter />
    </div>
  );
}
