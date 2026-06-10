"use client";

import Link from "next/link";
import { ArrowRight, Code2, FileText, Sparkles } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

export default function LandingPage() {
  return (
    <PublicPageFrame headerVariant="site" footerVariant="site">
      <main className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:px-14 lg:pb-24 lg:pt-28">
        <div className="max-w-[640px] lg:pr-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:text-[14px]">
            <Sparkles className="h-4 w-4" />
            <span>Developer intelligence platform</span>
          </div>

          <h1 className="mt-8 max-w-[780px] text-[clamp(1.9rem,7vw,4.35rem)] font-semibold leading-[0.98] tracking-[-0.07em] text-slate-950 sm:mt-10 sm:text-[clamp(3.1rem,5.2vw,4.35rem)]">
            Understand what
            <br />
            your <span className="text-[#5661ff]">code</span> is doing.
          </h1>

          <p className="mt-6 max-w-[560px] text-[16px] leading-[1.8] text-slate-600 sm:mt-7 sm:text-[17px]">
            CodeVista brings code execution, structured analysis, runtime
            tracing, and learning history into one workflow so you can
            understand what your code is doing without leaving the product.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row">
            <Link
              href="/editor"
              className="inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-full bg-slate-950 px-6 text-[16px] font-medium text-white shadow-[0_18px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-900 sm:w-auto"
            >
              <Code2 className="h-4 w-4" />
              Open the editor
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/about"
              className="inline-flex h-[56px] w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 text-[16px] font-medium text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              Read the product overview
            </Link>
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden="true">
          <div className="h-full min-h-[420px]" />
        </div>
      </main>
    </PublicPageFrame>
  );
}
