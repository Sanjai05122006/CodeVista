"use client";

import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
};

const THREAD_ID_STORAGE_KEY = "codevista.editor.chatThreadId";
const CHAT_STORAGE_PREFIX = "codevista_chat:";

const getStorageKey = (threadId: string) => `${CHAT_STORAGE_PREFIX}${threadId}`;

export const setStoredThreadId = (threadId: string) => {
  if (typeof window === "undefined" || !threadId) {
    return;
  }

  window.sessionStorage.setItem(THREAD_ID_STORAGE_KEY, threadId);
  window.localStorage.removeItem(THREAD_ID_STORAGE_KEY);
};

export const clearStoredChatState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(THREAD_ID_STORAGE_KEY);
  window.localStorage.removeItem(THREAD_ID_STORAGE_KEY);

  for (const storage of [window.sessionStorage, window.localStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (key?.startsWith(CHAT_STORAGE_PREFIX)) {
        storage.removeItem(key);
      }
    }
  }
};

export const getStoredThreadId = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing =
    window.sessionStorage.getItem(THREAD_ID_STORAGE_KEY) ||
    window.localStorage.getItem(THREAD_ID_STORAGE_KEY);

  if (existing) {
    window.sessionStorage.setItem(THREAD_ID_STORAGE_KEY, existing);
    window.localStorage.removeItem(THREAD_ID_STORAGE_KEY);
    return existing;
  }

  const nextThreadId = crypto.randomUUID();
  window.sessionStorage.setItem(THREAD_ID_STORAGE_KEY, nextThreadId);
  return nextThreadId;
};

export const useLocalChat = (
  threadId: string,
  initialMessages: StoredMessage[] = [],
  accessToken?: string | null
) => {
  const [messages, setMessages] = useState<StoredMessage[]>(initialMessages);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!threadId || typeof window === "undefined") {
      return;
    }

    let active = true;

    const loadMessages = async () => {
      try {
        if (accessToken) {
          const response = await fetch(buildApiUrl(`/chat/${threadId}`), {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = (await response.json().catch(() => null)) as
            | {
                messages?: Array<{
                  id?: string;
                  role: "user" | "assistant";
                  content: string;
                  provider?: string;
                  model?: string;
                }>;
              }
            | null;

          if (response.ok && Array.isArray(data?.messages)) {
            const normalizedMessages = data.messages.map((message, index) => ({
              id: message.id || `${threadId}-${index + 1}`,
              role: message.role,
              content: message.content,
              provider: message.provider,
              model: message.model,
            }));

            if (active) {
              setMessages(
                normalizedMessages.length > 0 ? normalizedMessages : initialMessages
              );
            }
            return;
          }
        }

        const stored = window.sessionStorage.getItem(getStorageKey(threadId));

        if (!active) {
          return;
        }

        if (stored) {
          const parsed = JSON.parse(stored) as StoredMessage[];
          setMessages(Array.isArray(parsed) ? parsed : initialMessages);
        } else {
          setMessages(initialMessages);
        }
      } catch {
        if (active) {
          setMessages(initialMessages);
        }
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, [accessToken, initialMessages, threadId]);

  useEffect(() => {
    if (!loaded || !threadId || typeof window === "undefined" || accessToken) {
      return;
    }

    window.sessionStorage.setItem(getStorageKey(threadId), JSON.stringify(messages));
  }, [accessToken, loaded, messages, threadId]);

  return { messages, setMessages, loaded };
};
