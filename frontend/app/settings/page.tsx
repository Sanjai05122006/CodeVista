"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Shield, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const settingCards = [
  {
    icon: <UserRound size={18} />,
    title: "Profile controls",
    description:
      "Reserved for display name, avatar preferences, and account personalization.",
  },
  {
    icon: <Bell size={18} />,
    title: "Notifications",
    description:
      "Placeholder for future product updates, reminders, and workspace alerts.",
  },
  {
    icon: <Shield size={18} />,
    title: "Privacy and security",
    description:
      "A future home for password, connected providers, and session-level controls.",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { loading, session } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-16 text-[#111827]">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,#eef2ff,#f8fafc,#ffffff)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-white px-4 py-1.5 text-sm text-[#4f46e5]">
            <Shield size={15} />
            Settings
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#111827]">
            Account settings are ready for the next phase
          </h1>
          <p className="mt-4 text-base leading-8 text-gray-500">
            This is a structured stub page so the account menu feels complete
            today and can expand cleanly later without changing the navigation
            pattern again.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {settingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-md">
                {card.icon}
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[#111827]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-[#c7d2fe] hover:bg-[#f8faff]"
          >
            Back to Home
          </Link>
          <Link
            href="/editor"
            className="rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_45px_rgba(99,102,241,0.28)]"
          >
            Open Editor
          </Link>
        </div>
      </div>
    </main>
  );
}
