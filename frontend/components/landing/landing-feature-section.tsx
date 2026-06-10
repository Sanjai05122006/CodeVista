import Link from "next/link";
import { ArrowRight } from "lucide-react";

const capabilityCards = [
  {
    eyebrow: "Execution",
    title: "Ground the interface in runtime facts.",
    description:
      "Judge0 or fallback execution results sit at the center of the workflow so the product can explain real behavior instead of inventing it.",
  },
  {
    eyebrow: "Analysis",
    title: "Keep AI outputs structured and reviewable.",
    description:
      "The PRD commits to deterministic analysis with schema validation, pseudocode, algorithm steps, and explicit time and space complexity.",
  },
  {
    eyebrow: "History",
    title: "Preserve the learning path across sessions.",
    description:
      "Saved sessions, restorable traces, and contextual chat are part of the core loop, not an afterthought attached to a code runner.",
  },
];

const surfaceRules = [
  "Neutral surfaces, border-led structure, and restrained shadows.",
  "Display typography for product positioning and mono labels for technical context.",
  "Black primary CTA with a hero-scale mesh atmosphere instead of repeated component gradients.",
];

export function LandingFeatureSection() {
  return (
    <section className="px-6 pb-24 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <p className="font-mono-ui text-[12px] text-[var(--mute)]">
              UI direction for this migration
            </p>
            <h2 className="font-display mt-4 text-[clamp(1.75rem,6vw,2rem)] font-semibold tracking-[-1.28px] text-[var(--ink)]">
              One workflow instead of five tabs.
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-[var(--body)] sm:text-[16px]">
              The repo’s product context is consistent: CodeVista is not just a
              code runner. It is an editor, execution layer, AI analysis
              surface, visualizer, and learning history system. The landing page
              now reflects that exact structure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {surfaceRules.map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-[var(--hairline)] bg-white p-5 cv-shadow-sm"
              >
                <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                  Rule
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink)]">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {capabilityCards.map((card) => (
            <article
              key={card.title}
              className="cv-shadow-md rounded-xl border border-[var(--hairline)] bg-white p-6"
            >
              <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                {card.eyebrow}
              </p>
              <h3 className="font-display mt-4 text-[clamp(1.25rem,4.5vw,1.5rem)] font-semibold tracking-[-0.96px] text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="mt-3 text-[13px] leading-6 text-[var(--body)] sm:text-sm sm:leading-7">
                {card.description}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl bg-[var(--ink)] px-6 py-8 text-[var(--on-primary)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="font-mono-ui text-[12px] text-white/55">
                Next migration path
              </p>
              <h2 className="font-display mt-4 text-[clamp(1.75rem,6vw,2rem)] font-semibold tracking-[-1.28px] text-white">
                If this page is approved, the same system can be applied to the
                rest of the public surface and then the app shell.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-white/72 sm:text-[16px]">
                The repo still contains the earlier violet-gradient language on
                login, register, about, contact, history, settings, and the
                editor shell. This landing page is now the first controlled
                reference for migrating those surfaces one by one.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex h-12 items-center gap-2 rounded-[100px] bg-white px-6 text-[16px] font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
            >
              Inspect the current app
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
