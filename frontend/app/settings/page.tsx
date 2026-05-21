"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, History, Mail, Shield, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const supportEmail = "sanjai05126@gmail.com";

const utilityCards = [
  {
    icon: <History size={18} />,
    title: "Review your sessions",
    description:
      "Open earlier coding sessions and continue from the exact point where you left off.",
    href: "/history",
    cta: "Open history",
  },
  {
    icon: <Mail size={18} />,
    title: "Need help?",
    description:
      "Send a product question or issue report directly through the contact page.",
    href: "/contact",
    cta: "Contact support",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { loading, session, signOut } = useAuth();

  const displayName =
    (session?.user?.user_metadata?.display_name as string | undefined) ||
    session?.user?.email ||
    "CodeVista user";

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  return (
    <PublicPageFrame headerVariant="landing">
      <main className="px-6 py-10 pb-16 text-[var(--ink)]">
        <div className="cv-shadow-lg mx-auto max-w-5xl rounded-[32px] border border-[var(--hairline)] bg-white p-8">
          <div className="max-w-2xl">
            <div className="font-mono-ui inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-1.5 text-[12px] text-[var(--body)]">
              <Shield size={15} />
              Settings
            </div>
            <h1 className="font-display mt-5 text-4xl font-semibold tracking-[-1.28px] text-[var(--ink)]">
              Your account space.
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--body)]">
              Keep the basics close: see which account you are using, continue
              your learning flow, and reach support when you need help.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="cv-shadow-md rounded-[24px] border border-[var(--hairline)] bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                <UserRound size={20} />
              </div>
              <h2 className="font-display mt-5 text-2xl font-semibold tracking-[-0.72px] text-[var(--ink)]">
                Account overview
              </h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
                  <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                    Display name
                  </p>
                  <p className="mt-2 text-base font-medium text-[var(--ink)]">
                    {displayName}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-4">
                  <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                    Email
                  </p>
                  <p className="mt-2 break-all text-base font-medium text-[var(--ink)]">
                    {session?.user?.email || supportEmail}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-5">
              {utilityCards.map((card) => (
                <article
                  key={card.title}
                  className="cv-shadow-md rounded-[24px] border border-[var(--hairline)] bg-white p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                    {card.icon}
                  </div>
                  <h2 className="font-display mt-5 text-xl font-semibold tracking-[-0.54px] text-[var(--ink)]">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--body)]">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink)]"
                  >
                    {card.cta}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </section>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/"
              className="rounded-2xl border border-[var(--hairline)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
            >
              Back to Home
            </Link>
            <Link
              href="/editor"
              className="rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
            >
              Open Editor
            </Link>
            <button
              type="button"
              onClick={() => {
                void signOut().then(() => router.replace("/"));
              }}
              className="rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </PublicPageFrame>
  );
}
