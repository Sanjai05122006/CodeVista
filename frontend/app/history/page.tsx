"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, History, MoveRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchSessionHistory } from "@/lib/api";

type HistorySession = {
  id: string;
  title: string | null;
  created_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const { accessToken, loading, session } = useAuth();
  const [items, setItems] = useState<HistorySession[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  useEffect(() => {
    if (!accessToken) {
      setFetching(false);
      return;
    }

    let active = true;

    void fetchSessionHistory(accessToken, { limit: 20 })
      .then((data) => {
        if (!active) {
          return;
        }

        setItems(data.sessions);
        setError(null);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load session history."
        );
      })
      .finally(() => {
        if (active) {
          setFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] px-6 py-16 text-gray-500">
        Loading history...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-16 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,#eef2ff,#f8fafc,#ffffff)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-white px-4 py-1.5 text-sm text-[#4f46e5]">
                <History size={15} />
                Editor History
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#111827]">
                Your saved coding sessions
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-gray-500">
                This page is the first step toward a fuller history workflow.
                Saved sessions are listed here so phase 2 can extend into session
                restore, comparison, and deeper history management.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-5 py-3 text-sm font-medium text-white shadow-[0_18px_45px_rgba(99,102,241,0.28)]"
            >
              Open Editor
              <MoveRight size={16} />
            </Link>
          </div>

          <div className="mt-10">
            {fetching ? (
              <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-8 text-sm text-gray-500">
                Fetching saved sessions...
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-sm text-red-500">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-[#e5e7eb] bg-white p-8">
                <p className="text-lg font-semibold text-[#111827]">
                  No saved sessions yet
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  Run code in the editor and save activity through the existing
                  session pipeline. Your recent work will appear here once
                  records exist.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xl font-semibold text-[#111827]">
                          {item.title || "Untitled session"}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <Clock3 size={14} />
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                        Session saved
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
