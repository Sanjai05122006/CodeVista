"use client";

import { useAuth } from "@/lib/auth-context";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--canvas)] text-[var(--ink)] font-body">
      <div className="cv-mesh-gradient absolute inset-x-0 top-0 -z-20 h-[920px]" />
      <div className="cv-mesh-fade absolute inset-x-0 top-0 -z-10 h-[860px]" />
      <LandingHeader user={user} variant="landing" />
      <div className="flex-1">
        <LandingHero user={user} />
      </div>
      <LandingFooter />
    </main>
  );
}
