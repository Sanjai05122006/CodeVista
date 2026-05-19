"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, History, MoveRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchSessionHistory } from "@/lib/api";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

type HistorySession = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  language: string | null;
  execution_count: number;
};

const PAGE_SIZE = 5;
const HISTORY_CACHE_PREFIX = "codevista.history.cache:";

type HistoryCachePayload = {
  items: HistorySession[];
  hasMore: boolean;
};

const getHistoryCacheKey = (userId: string) =>
  `${HISTORY_CACHE_PREFIX}${userId}`;

export default function HistoryPage() {
  const router = useRouter();
  const { accessToken, loading, session } = useAuth();
  const [items, setItems] = useState<HistorySession[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, router, session]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    const userId = session?.user?.id ?? null;

    if (typeof window !== "undefined" && userId) {
      const cached = window.sessionStorage.getItem(getHistoryCacheKey(userId));

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as HistoryCachePayload;

          if (Array.isArray(parsed.items) && typeof parsed.hasMore === "boolean") {
            setItems(parsed.items);
            setHasMore(parsed.hasMore);
            setFetching(false);
            setError(null);
            return () => {
              active = false;
            };
          }
        } catch {
          window.sessionStorage.removeItem(getHistoryCacheKey(userId));
        }
      }
    }

    setFetching(true);
    setError(null);

    void fetchSessionHistory(accessToken, { limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!active) {
          return;
        }

        setItems(data.sessions);
        setHasMore(data.sessions.length === PAGE_SIZE);
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
  }, [accessToken, session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;

    if (typeof window === "undefined" || !userId || fetching || error) {
      return;
    }

    const payload: HistoryCachePayload = {
      items,
      hasMore,
    };

    window.sessionStorage.setItem(
      getHistoryCacheKey(userId),
      JSON.stringify(payload)
    );
  }, [error, fetching, hasMore, items, session?.user?.id]);

  const loadMore = async () => {
    if (!accessToken || fetchingMore || !hasMore) {
      return;
    }

    setFetchingMore(true);

    try {
      const data = await fetchSessionHistory(accessToken, {
        limit: PAGE_SIZE,
        offset: items.length,
      });

      setItems((current) => [...current, ...data.sessions]);
      setHasMore(data.sessions.length === PAGE_SIZE);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load more sessions."
      );
    } finally {
      setFetchingMore(false);
    }
  };

  if (loading) {
    return (
      <PublicPageFrame>
        <main className="flex min-h-full px-6 py-10 text-gray-500">
          <div className="mx-auto flex w-full max-w-5xl flex-1 items-start">
            <div className="w-full rounded-[32px] border border-white/60 bg-white/65 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              Loading history...
            </div>
          </div>
        </main>
      </PublicPageFrame>
    );
  }

  return (
    <PublicPageFrame>
      <main className="flex min-h-full px-6 py-10 pb-16 text-[#111827]">
        <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-white/65 bg-[linear-gradient(145deg,rgba(238,242,255,0.82),rgba(248,250,252,0.88),rgba(255,255,255,0.82))] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d2fe] bg-white px-4 py-1.5 text-sm text-[#4f46e5]">
                <History size={15} />
                History
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#111827]">
                Your saved coding sessions
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-gray-500">
                Reopen previous work with its saved code, analysis, execution
                output, and attached conversation context. This is the recovery
                layer that keeps CodeVista useful across multiple learning
                sessions.
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
              <div className="rounded-[28px] border border-white/70 bg-white/75 p-8 text-sm text-gray-500 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                Fetching saved sessions...
              </div>
            ) : error ? (
              <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-sm text-red-500">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-white/70 bg-white/75 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-xl">
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
                    className="rounded-[28px] border border-white/70 bg-white/72 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl"
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
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">
                            {item.language || "Unknown language"}
                          </span>
                          <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500">
                            {item.execution_count} run{item.execution_count === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/editor?sessionId=${item.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#4f46e5] transition hover:bg-[#e0e7ff]"
                      >
                        Reopen Session
                      </Link>
                    </div>
                  </div>
                ))}

                {hasMore ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        void loadMore();
                      }}
                      disabled={fetchingMore}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#c7d2fe] bg-white/80 px-5 py-3 text-sm font-medium text-[#4f46e5] shadow-[0_12px_30px_rgba(15,23,42,0.04)] backdrop-blur transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {fetchingMore ? "Loading more..." : "Show More"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </PublicPageFrame>
  );
}
