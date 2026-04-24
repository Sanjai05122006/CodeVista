"use client";

import { useEffect, useState } from "react";

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
};

const getStorageKey = (threadId: string) => `codevista_chat:${threadId}`;

export const useLocalChat = (
  threadId: string,
  initialMessages: StoredMessage[] = []
) => {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!threadId || typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(getStorageKey(threadId));

      if (stored) {
        const parsed = JSON.parse(stored) as StoredMessage[];
        setMessages(Array.isArray(parsed) ? parsed : initialMessages);
      } else {
        setMessages(initialMessages);
      }
    } catch {
      setMessages(initialMessages);
    } finally {
      setLoaded(true);
    }
  }, [initialMessages, threadId]);

  useEffect(() => {
    if (!loaded || !threadId || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(getStorageKey(threadId), JSON.stringify(messages));
  }, [loaded, messages, threadId]);

  return { messages, setMessages, loaded };
};
