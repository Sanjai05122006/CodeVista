import { Activity, BookOpen, GitBranch, Sparkles } from "lucide-react";

const featureList = [
  {
    icon: <BookOpen size={20} />,
    title: "Learning-first experience",
    description:
      "The interface is shaped around understanding concepts, not just compiling code and moving on.",
  },
  {
    icon: <GitBranch size={20} />,
    title: "Execution visibility",
    description:
      "See how code behaves across each step so algorithm logic becomes easier to grasp and explain.",
  },
  {
    icon: <Activity size={20} />,
    title: "Performance awareness",
    description:
      "Connect your implementation with complexity and efficiency insights in the same workflow.",
  },
];

export function LandingFeatureSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
      <div className="rounded-[32px] border border-[#e5e7eb] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:p-10">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.22em] text-[#6366f1]">
            <Sparkles size={15} />
            What CodeVista helps you do
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
            Move from writing code to truly understanding it.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-500">
            The landing experience now reflects the actual product goal:
            helping users learn, visualize, and analyze code with a consistent
            interface from homepage to authentication to editor.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[24px] border border-[#e5e7eb] bg-[#f8fafc] p-6 transition hover:border-[#c7d2fe] hover:bg-[#f8faff]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-md">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
