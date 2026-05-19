import Link from "next/link";
import { ArrowRight, Bug, LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null;
const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL?.trim() || null;

const contactCards = [
  {
    title: "Support",
    description:
      "Use this for help with accounts, saved sessions, execution replay, and product usage.",
    icon: LifeBuoy,
    actionLabel: supportEmail ? "Email support" : "Support email not configured",
    href: supportEmail ? `mailto:${supportEmail}?subject=CodeVista%20Support` : null,
  },
  {
    title: "Bug reports",
    description:
      "Use this when something breaks and you want to report the issue with enough detail to reproduce it.",
    icon: Bug,
    actionLabel: githubUrl ? "Open repository" : "Repository link not configured",
    href: githubUrl,
  },
  {
    title: "Contact us",
    description:
      "Use this for demos, collaboration, classroom usage, or general product questions.",
    icon: MessageSquare,
    actionLabel: supportEmail ? "Send message" : "Contact channel not configured",
    href: supportEmail ? `mailto:${supportEmail}?subject=CodeVista%20Contact` : null,
  },
];

export default function ContactPage() {
  return (
    <PublicPageFrame>
      <main className="px-6 py-6 pb-12 text-[#111827]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,#ffffff_0%,#eef2ff_52%,#eff6ff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="px-8 py-10 lg:px-12 lg:py-14">
            <p className="text-xs uppercase tracking-[0.28em] text-[#4f46e5]">
              Contact
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl">
              Simple support and contact paths for the product.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-gray-600">
              If you need help with saved sessions, product usage, or reporting
              an issue, use the route that matches the task. Keep the message
              short, specific, and tied to the affected workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(99,102,241,0.28)] transition hover:translate-y-[-1px]"
              >
                View Sessions
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#c7d2fe] bg-white px-5 py-3 text-sm font-medium text-[#4338ca] transition hover:bg-[#f8faff]"
              >
                About CodeVista
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {contactCards.map((item) => {
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

                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#c7d2fe] bg-[#eef2ff] px-4 py-3 text-sm font-medium text-[#4338ca] transition hover:bg-[#e0e7ff]"
                  >
                    {item.actionLabel}
                    <ArrowRight size={15} />
                  </a>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-[#dbe4f0] px-4 py-3 text-sm text-gray-500">
                    {item.actionLabel}
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-[30px] border border-[#e5e7eb] bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#eff6ff] text-[#4f46e5]">
              <Mail size={20} />
            </div>
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                What to send with a support request
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Include the session ID when relevant, the exact error text, and
                whether the problem happened during run, analysis, chat, or
                session reopen. That is usually enough to investigate the issue
                properly.
              </p>
            </div>
          </div>
        </section>
        </div>
      </main>
    </PublicPageFrame>
  );
}
