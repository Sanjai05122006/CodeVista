import Link from "next/link";
import { ArrowRight, BookOpen, GitBranch, LifeBuoy, Sparkles } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const valuePoints = [
  {
    title: "Learn in one place",
    description:
      "Write code, run it, inspect execution, and understand the logic without jumping between multiple tools.",
    icon: BookOpen,
  },
  {
    title: "See what your code is doing",
    description:
      "Execution flow, analysis, and saved context stay connected so the code feels easier to follow and explain.",
    icon: Sparkles,
  },
  {
    title: "Pick up where you left off",
    description:
      "Saved sessions help you come back to earlier work, review what happened, and continue learning without starting over.",
    icon: GitBranch,
  },
  {
    title: "Feel more confident",
    description:
      "The product is built to make difficult code feel less intimidating by turning runtime behavior into something clearer and more manageable.",
    icon: LifeBuoy,
  },
];

export default function AboutPage() {
  return (
    <PublicPageFrame headerVariant="landing">
      <main className="px-6 py-10 pb-16 text-[var(--ink)] lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="cv-shadow-lg overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white">
          <div className="mx-auto max-w-4xl px-8 py-12 text-center lg:px-12 lg:py-16">
            <p className="font-mono-ui text-[12px] text-[var(--mute)]">
              About CodeVista
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold tracking-[-1.28px] text-[var(--ink)] sm:text-5xl">
              A clean workspace for understanding code better.
            </h1>
            <p className="mt-6 text-base leading-8 text-[var(--body)]">
              CodeVista is built for people who want to understand code with
              less friction. It brings writing, running, visualizing, and
              reviewing code into one calmer learning flow.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/editor"
                className="inline-flex h-12 items-center gap-2 rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
              >
                Open Editor
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center gap-2 rounded-[100px] border border-[var(--hairline)] bg-white px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
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
                className="cv-shadow-md rounded-xl border border-[var(--hairline)] bg-white p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                  <Icon size={20} />
                </div>
                <h2 className="font-display mt-5 text-2xl font-semibold tracking-[-0.96px] text-[var(--ink)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--body)]">
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
