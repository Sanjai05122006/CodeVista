"use client";

import { useCallback, useEffect, useRef } from "react";
import { buildApiUrl } from "@/lib/api";

export type PersistedChatMessage = {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
  sequence?: number;
};

type UseChatPersistenceInput = {
  threadId: string;
  title?: string;
  sessionId?: string | null;
  accessToken?: string | null;
};

const SAVE_DEBOUNCE_MS = 1500;

export const useChatPersistence = ({
  threadId,
  title,
  sessionId,
  accessToken,
}: UseChatPersistenceInput) => {
  const buffer = useRef<PersistedChatMessage[]>([]);
  const timeout = useRef<number | null>(null);
  const flushInFlight = useRef<Promise<boolean> | null>(null);

  const clearScheduledFlush = useCallback(() => {
    if (timeout.current !== null) {
      window.clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    if (flushInFlight.current) {
      return flushInFlight.current;
    }

    if (!threadId || !buffer.current.length) {
      return true;
    }

    const batch = [...buffer.current];
    buffer.current = [];

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const request = fetch(buildApiUrl("/chat/batch"), {
      method: "POST",
      body: JSON.stringify({ threadId, sessionId, title, messages: batch }),
      headers,
      keepalive: true,
    })
      .then(async (response) => {
        await response.json().catch(() => null);

        return true;
      })
      .catch((error) => {
        buffer.current = [...batch, ...buffer.current];
        return false;
      })
      .finally(() => {
        flushInFlight.current = null;
      });

    flushInFlight.current = request;
    return request;
  }, [accessToken, sessionId, threadId, title]);

  const schedule = useCallback(() => {
    clearScheduledFlush();
    timeout.current = window.setTimeout(() => {
      void flush();
    }, SAVE_DEBOUNCE_MS);
  }, [clearScheduledFlush, flush]);

  const add = useCallback(
    (msg: PersistedChatMessage) => {
      buffer.current.push(msg);
      schedule();
    },
    [schedule]
  );

  useEffect(() => {
    const handlePageHide = () => {
      clearScheduledFlush();

      if (!threadId || !buffer.current.length) {
        return;
      }

      const batch = [...buffer.current];
      buffer.current = [];

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      void fetch(buildApiUrl("/chat/batch"), {
        method: "POST",
        body: JSON.stringify({ threadId, sessionId, title, messages: batch }),
        headers,
        keepalive: true,
      }).catch(() => {
        buffer.current = [...batch, ...buffer.current];
      });
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      clearScheduledFlush();
      void flush();
    };
  }, [accessToken, clearScheduledFlush, flush, sessionId, threadId, title]);

  return { add, flush };
};
