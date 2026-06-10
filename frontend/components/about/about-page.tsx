"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Code2,
  Clock3,
  FileText,
  Play,
} from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const impactPoints = [
  {
    icon: Code2,
    title: "1 Platform",
    label: "Everything you need",
    description: "Write, run, and review code without jumping between tools.",
  },
  {
    icon: FileText,
    title: "AI Powered",
    label: "Structured analysis",
    description: "Get clear explanations that make runtime behavior easier to follow.",
  },
  {
    icon: Play,
    title: "Visual First",
    label: "See execution flow",
    description: "Trace what your code is doing in a way that feels concrete.",
  },
  {
    icon: Clock3,
    title: "Built for Learning",
    label: "History and replay",
    description: "Return to past sessions and keep improving over time.",
  },
];

const differenceCards = [
  {
    icon: Code2,
    title: "Execute Real Code",
    description:
      "Run code in a secure environment and get real outputs with execution metrics.",
  },
  {
    icon: FileText,
    title: "Structured Analysis",
    description:
      "Get pseudocode, algorithm steps, and complexity analysis powered by AI.",
  },
  {
    icon: BarChart3,
    title: "Visualise Execution",
    description:
      "Step through variables, call stack, and data flow with clear visuals.",
  },
  {
    icon: Bookmark,
    title: "Learn & Revisit",
    description:
      "Save sessions, revisit them later, and track your learning journey over time.",
  },
];

export function AboutPage() {
  return (
    <PublicPageFrame headerVariant="site" footerVariant="site">
      <main className="px-4 py-6 pb-12 text-slate-950 sm:px-8 sm:py-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 sm:gap-6">
          <section className="cv-shadow-lg overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-white">
            <div className="mx-auto flex max-w-[980px] flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-14 lg:px-12 lg:py-16">
              <p className="font-mono-ui text-[12px] tracking-[0.18em] text-[var(--mute)] uppercase">
                About CodeVista
              </p>
              <h1 className="font-display mt-4 max-w-[860px] text-[clamp(1.75rem,6vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.06em] text-slate-950 sm:mt-5">
                We&apos;re building the most intuitive way to understand code.
              </h1>
              <p className="mt-5 max-w-[860px] text-[15px] leading-[1.75] text-slate-600 sm:mt-6 sm:text-[16px]">
                CodeVista is a developer intelligence platform that combines
                code execution, structured analysis, and step-by-step
                visualisation in one place. The goal is simple: remove friction
                from learning and help developers understand what their code is
                doing.
              </p>

              <div className="mt-10 grid w-full gap-px overflow-hidden rounded-[24px] border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2 xl:grid-cols-4">
                {impactPoints.map((point) => {
                  const Icon = point.icon;

                  return (
                    <article
                      key={point.title}
                      className="bg-white px-6 py-7 text-center sm:px-7 sm:py-8"
                    >
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                        <Icon size={18} />
                      </div>
                      <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--mute)]">
                        {point.title}
                      </p>
                      <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[19px]">
                        {point.label}
                      </h2>
                      <p className="mx-auto mt-3 max-w-[230px] text-[14px] leading-[1.7] text-slate-600">
                        {point.description}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <Link
                  href="/editor"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-[14px] font-medium text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition hover:bg-slate-900"
                >
                  Open Editor
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-[14px] font-medium text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </section>

          <section className="cv-shadow-md overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-white">
            <div className="mx-auto max-w-[980px] px-5 py-10 text-center sm:px-8 sm:py-12 lg:px-12">
              <h2 className="font-display text-[clamp(1.5rem,2.8vw,2.3rem)] font-semibold tracking-[-0.06em] text-slate-950">
                What makes CodeVista different?
              </h2>
              <p className="mx-auto mt-4 max-w-[680px] text-[15px] leading-[1.75] text-slate-600">
                We keep the experience focused on understanding, not on
                switching between tools.
              </p>
            </div>

            <div className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6 lg:grid-cols-2 xl:grid-cols-4">
              {differenceCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className="rounded-[24px] border border-[var(--hairline)] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                      <Icon size={17} />
                    </div>
                    <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[19px]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.75] text-slate-600">
                      {card.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </PublicPageFrame>
  );
}
