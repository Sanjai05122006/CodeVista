"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, History, MoveRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchSessionHistory } from "@/lib/api";
import { PublicPageFrame } from "@/components/layout/public-page-frame";
import { StatusCard } from "@/components/ui/StatusCard";

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
            queueMicrotask(() => {
              if (!active) {
                return;
              }

              setItems(parsed.items);
              setHasMore(parsed.hasMore);
              setFetching(false);
              setError(null);
            });
            return () => {
              active = false;
            };
          }
        } catch {
          window.sessionStorage.removeItem(getHistoryCacheKey(userId));
        }
      }
    }

    const resetTimer = window.setTimeout(() => {
      setFetching(true);
      setError(null);
    }, 0);

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
      window.clearTimeout(resetTimer);
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
      <PublicPageFrame headerVariant="landing">
        <main className="flex min-h-full px-6 py-10 text-[var(--body)] lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-1 items-start">
            <div className="w-full">
              <StatusCard
                tone="info"
                title="Loading history"
                message="Preparing your saved sessions."
              />
            </div>
          </div>
        </main>
      </PublicPageFrame>
    );
  }

  return (
    <PublicPageFrame headerVariant="landing">
      <main className="flex min-h-full px-6 py-10 pb-16 text-[var(--ink)] lg:px-10">
        <div className="mx-auto max-w-5xl">
        <div className="cv-shadow-lg rounded-2xl border border-[var(--hairline)] bg-white p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-mono-ui inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-1.5 text-[12px] text-[var(--body)]">
                <History size={15} />
                History
              </div>
              <h1 className="font-display mt-5 text-4xl font-semibold tracking-[-1.28px] text-[var(--ink)]">
                Your saved coding sessions
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-[var(--body)]">
                Reopen previous work with its saved code, analysis, execution
                output, and attached conversation context. This is the recovery
                layer that keeps CodeVista useful across multiple learning
                sessions.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex h-12 items-center gap-2 rounded-[100px] bg-[var(--ink)] px-5 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
            >
              Open Editor
              <MoveRight size={16} />
            </Link>
          </div>

          <div className="mt-10">
            {fetching ? (
              <StatusCard
                tone="info"
                title="Fetching saved sessions"
                message="Retrieving your saved sessions now."
              />
            ) : error ? (
              <StatusCard
                tone="error"
                title="Unable to load history"
                message={error}
              />
            ) : items.length === 0 ? (
              <StatusCard
                tone="neutral"
                title="No saved sessions yet"
                message="Run code in the editor and save activity through the existing session pipeline. Your recent work will appear here once records exist."
              />
            ) : (
              <div className="grid gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="cv-shadow-md rounded-xl border border-[var(--hairline)] bg-white p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-display text-xl font-semibold tracking-[-0.6px] text-[var(--ink)]">
                          {item.title || "Untitled session"}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--body)]">
                          <Clock3 size={14} />
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="font-mono-ui rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-1 text-[11px] text-[var(--body)]">
                            {item.language || "Unknown language"}
                          </span>
                          <span className="font-mono-ui rounded-full border border-[var(--hairline)] bg-[var(--canvas-soft)] px-3 py-1 text-[11px] text-[var(--body)]">
                            {item.execution_count} run{item.execution_count === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/editor?sessionId=${item.id}`}
                        className="inline-flex items-center justify-center rounded-[100px] bg-[var(--ink)] px-4 py-2 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
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
                      className="inline-flex items-center justify-center rounded-[100px] border border-[var(--hairline)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)] disabled:cursor-not-allowed disabled:opacity-60"
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
