import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";

export function LandingHero({ user }: { user: User | null }) {
  return (
    <section className="px-6 pb-20 pt-14 lg:px-10 lg:pb-24 lg:pt-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <p className="font-mono-ui rounded-full border border-[var(--hairline)] bg-white px-4 py-1.5 text-[12px] text-[var(--body)] cv-shadow-sm">
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
              className="inline-flex h-12 items-center rounded-[100px] border border-[var(--hairline)] bg-white px-6 text-[16px] font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
            >
              Read the product overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
