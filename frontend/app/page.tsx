"use client";

import { useAuth } from "@/lib/auth-context";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatureSection } from "@/components/landing/landing-feature-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] text-[#111827]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)]" />
      <LandingHeader user={user} />
      <LandingHero user={user} />
      <LandingFeatureSection />
      <LandingFooter />
    </main>
  );
}
