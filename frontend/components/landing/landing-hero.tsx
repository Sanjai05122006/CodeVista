import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";

export function LandingHero({ user }: { user: User | null }) {
  return (
    <section className="relative px-6 pb-24 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-[-56px] -z-10 h-[680px]">
        <div className="cv-hero-atmosphere absolute inset-x-[4%] top-0 h-full rounded-[40px]" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <div className="pointer-events-none absolute inset-x-10 top-20 -z-10 h-[360px] rounded-[999px] bg-white/72 blur-3xl" />

          <p className="font-mono-ui rounded-full border border-white/70 bg-white/82 px-4 py-1.5 text-[12px] text-[var(--body)] backdrop-blur cv-shadow-sm">
            Developer intelligence platform
          </p>

          <h1 className="font-display mt-8 max-w-4xl text-[40px] font-semibold tracking-[-2px] text-[var(--ink)] sm:text-[48px] sm:leading-[48px]">
            Understand what your code is doing.
          </h1>

          <p className="mt-6 max-w-3xl text-[18px] leading-7 text-[var(--body)]">
            CodeVista brings code execution, structured analysis, runtime
            tracing, and learning history into one workflow. The product is
            built to remove the context-switching tax described in the PRD,
            not to look like another violet AI dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/editor" : "/register"}
              className="inline-flex h-12 items-center gap-2 rounded-[100px] bg-[var(--ink)] px-6 text-[16px] font-medium text-[var(--on-primary)] transition hover:opacity-90"
            >
              {user ? "Open the editor" : "Start learning"}
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-12 items-center rounded-[100px] border border-white/70 bg-white/84 px-6 text-[16px] font-medium text-[var(--ink)] backdrop-blur transition hover:bg-white"
            >
              Read the product overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
