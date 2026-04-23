import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Code2, GitBranch, Radar } from "lucide-react";

const highlights = [
  "Write code in a focused editor",
  "Visualize the execution step by step",
  "Understand performance and algorithm behavior",
];

export function LandingHero({ user }: { user: User | null }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pb-24 lg:pt-12">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-white/80 px-4 py-1.5 text-sm text-[#4f46e5] shadow-sm backdrop-blur">
          <Radar size={15} />
          Built for coding, visualization, and understanding
        </div>

        <h1 className="mt-7 text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-[64px] lg:leading-[1.04]">
          Learn what your code is{" "}
          <span className="bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">
            actually doing
          </span>
          .
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-gray-500 sm:text-lg">
          CodeVista is a learning-focused coding workspace where you can write,
          run, visualize, and analyze programs in one clean interface. The
          experience is designed to help students and developers understand code
          deeply, not just execute it.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={user ? "/editor" : "/register"}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-6 py-3.5 text-sm font-medium text-white shadow-[0_20px_50px_rgba(99,102,241,0.34)] transition hover:translate-y-[-1px]"
          >
            {user ? "Go to Editor" : "Get Started"}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-700 transition hover:border-[#c7d2fe] hover:bg-[#f8faff]"
          >
            About CodeVista
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:max-w-xl">
          {highlights.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-gray-600 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#4f46e5]">
                <ArrowRight size={14} />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-10 top-8 -z-10 h-40 w-40 rounded-full bg-[#6366f1]/15 blur-3xl" />
        <div className="absolute bottom-6 right-8 -z-10 h-40 w-40 rounded-full bg-[#7c3aed]/12 blur-3xl" />

        <div className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="rounded-[26px] bg-[linear-gradient(145deg,#111827,#1f2937)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white/90">
                  Smart coding workspace
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-indigo-200/70">
                  Product overview
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] shadow-lg">
                <Code2 size={22} />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <HeroCard
                icon={<Code2 size={18} />}
                title="Write and run"
                description="Use the editor to test ideas quickly and iterate without distraction."
              />
              <HeroCard
                icon={<GitBranch size={18} />}
                title="Visualize execution"
                description="Break logic into understandable execution flow for stronger learning."
              />
              <HeroCard
                icon={<Radar size={18} />}
                title="Analyze complexity"
                description="Review runtime and algorithm-level understanding in the same workspace."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-md">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}
