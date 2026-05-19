import Link from "next/link";
import { ArrowRight, BookOpen, GitBranch, LifeBuoy, Sparkles } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const valuePoints = [
  {
    title: "What we do",
    description:
      "CodeVista helps users write code, run it, inspect execution, and understand the algorithm in one place.",
    icon: BookOpen,
  },
  {
    title: "Why CodeVista",
    description:
      "The product is built to reduce context switching between editor, output, explanation, and saved learning history.",
    icon: Sparkles,
  },
  {
    title: "How it helps",
    description:
      "Users can revisit saved sessions, inspect trace steps, review complexity, and continue from previous work.",
    icon: GitBranch,
  },
  {
    title: "Support",
    description:
      "The website includes clear support and contact routes so issues around sessions, replay, or analysis can be reported properly.",
    icon: LifeBuoy,
  },
];

export default function AboutPage() {
  return (
    <PublicPageFrame>
      <main className="px-6 py-6 pb-12 text-[#111827]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef2ff_52%,#eff6ff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="px-8 py-10 lg:px-12 lg:py-14">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4f46e5]">
              About CodeVista
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl">
              A clean workspace for understanding code better.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-gray-600">
              CodeVista is built for learners and developers who want more than
              code execution. It connects writing, running, visualizing, and
              reviewing code in a single product flow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(99,102,241,0.28)] transition hover:translate-y-[-1px]"
              >
                Open Editor
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#c7d2fe] bg-white px-5 py-3 text-sm font-medium text-[#4338ca] transition hover:bg-[#f8faff]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {valuePoints.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-[30px] border border-[#e5e7eb] bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#eff6ff] text-[#4f46e5]">
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#111827]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>
        </div>
      </main>
    </PublicPageFrame>
  );
}
