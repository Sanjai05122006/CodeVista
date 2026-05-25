"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { useLocalChat } from "@/hooks/useLocalChat";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import { useChatPersistence } from "@/hooks/useChatPersistence";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  model?: string;
};

type ChatContainerProps = {
  threadId: string;
  title?: string;
  sessionId?: string | null;
  accessToken?: string | null;
  context?: unknown;
  autoOpen?: boolean;
  restoredConversation?: boolean;
};

const createMessageId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getAssistantIntro = (title?: string) =>
  title
    ? `Hi! I can help you understand the code in ${title}. Ask me about behavior, complexity, output, bugs, or what to try next.`
    : "Hi! I can help you understand your code. Ask me anything about your code, algorithm, complexity, or output.";

const formatReply = (text: string) =>
  text
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default function CopilotWidget({
  threadId,
  title,
  sessionId,
  accessToken,
  context,
  autoOpen = false,
  restoredConversation = false,
}: ChatContainerProps) {
  const initialMessages = useMemo(
    () => [
      {
        id: createMessageId(),
        role: "assistant" as const,
        content: getAssistantIntro(title),
      },
    ],
    [title]
  );
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [stream, setStream] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const timerRef = useRef<number | null>(null);
  const { messages, setMessages, loaded } = useLocalChat(
    threadId,
    initialMessages,
    accessToken
  );
  const { add, flush } = useChatPersistence({
    threadId,
    title,
    sessionId,
    accessToken,
  });

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAI, stream, open]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      void flush().catch(() => false);
    };
  }, [flush]);

  const typed = useTypingEffect(stream);
  const status = error ? "error" : loadingAI ? "syncing" : "saved";

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || loadingAI) {
      return;
    }

    if (!accessToken) {
      setError("Sign in is required to use the secured assistant.");
      return;
    }

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };
    const historySnapshot = [...messagesRef.current, userMessage].map(
      ({ role, content, provider, model }) => ({
        role,
        content,
        provider,
        model,
      })
    );
    const nextUserSequence = messagesRef.current.length + 1;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingAI(true);
    setError(null);
    add({
      role: userMessage.role,
      content: userMessage.content,
      sequence: nextUserSequence,
    });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(buildApiUrl("/chat"), {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          context,
          history: historySnapshot,
        }),
        headers,
      });

      const data = (await response.json().catch(() => null)) as
        | {
        reply?: string;
        provider?: string;
        model?: string;
        error?: string;
      }
        | null;

      if (!response.ok || !data?.reply) {
        throw new Error("CHAT_REQUEST_FAILED");
      }

      const formattedReply = formatReply(data.reply);
      setStream(formattedReply);

      timerRef.current = window.setTimeout(() => {
        const assistantMessage: Message = {
          id: createMessageId(),
          role: "assistant",
          content: formattedReply,
          provider: data.provider,
          model: data.model,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        add({
          role: assistantMessage.role,
          content: assistantMessage.content,
          provider: assistantMessage.provider,
          model: assistantMessage.model,
          sequence: nextUserSequence + 1,
        });
        setStream("");
        setLoadingAI(false);
      }, Math.min(Math.max(formattedReply.length * 10, 600), 2200));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "CHAT_REQUEST_FAILED";
      setLoadingAI(false);
      setStream("");
      setError(
        message.includes("AUTH_REQUIRED") ||
          message.includes("MISSING_AUTH_TOKEN") ||
          message.includes("INVALID_AUTH_TOKEN")
          ? "Sign in is required to use the secured assistant."
          : "Unable to get a reply right now. Please try again."
      );
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="cv-shadow-lg fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--hairline)] bg-[var(--ink)] text-[var(--on-primary)] sm:bottom-8 sm:right-8"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          className="cv-shadow-lg fixed bottom-6 right-6 z-50 flex h-[620px] max-h-[78vh] w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] sm:bottom-8 sm:right-8"
        >
          <div className="relative flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3 text-[var(--ink)]">
            <div>
              <div className="font-display text-sm font-semibold tracking-[-0.02em]">
                CodeVista assistant
              </div>
              <div className="text-xs text-[var(--mute)]">Code-aware workspace help</div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-[var(--hairline)] px-2 py-1 text-xs text-[var(--body)] transition hover:bg-[var(--canvas-soft)]"
            >
              Close
            </button>
          </div>

          <div className="relative flex flex-wrap items-center gap-2 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-2 text-xs text-[var(--mute)]">
            {restoredConversation ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--body)]">
                <span className="h-2 w-2 rounded-full bg-[var(--ink)]" />
                Restored conversation
              </div>
            ) : null}
            {status === "saved" && (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Saved
              </>
            )}
            {status === "syncing" && (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                Syncing...
              </>
            )}
            {status === "error" && (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Connection issue
              </>
            )}
          </div>

          <div className="relative flex-1 space-y-3 overflow-y-auto bg-[var(--canvas-soft)] px-4 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--ink)] text-[var(--on-primary)]"
                      : "border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)]"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {loadingAI && !stream && (
              <div className="flex justify-start">
                <div className="w-[200px] max-w-[75%] rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3">
                  <div className="space-y-2">
                    <div className="shimmer h-3 rounded bg-[var(--canvas-soft-2)]" />
                    <div className="shimmer h-3 w-4/5 rounded bg-[var(--canvas-soft-2)]" />
                    <div className="shimmer h-3 w-2/3 rounded bg-[var(--canvas-soft-2)]" />
                  </div>
                </div>
              </div>
            )}

            {stream && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-2 text-sm text-[var(--ink)]">
                  <div className="whitespace-pre-wrap">{typed}</div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="relative border-t border-[var(--hairline)] bg-[var(--canvas)] p-3">
            {error ? (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <input
                disabled={!loaded}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about your code..."
                className="flex-1 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--mute)]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />

              <button
                onClick={() => {
                  void sendMessage();
                }}
                className="rounded-lg bg-[var(--ink)] px-4 py-2 text-[var(--on-primary)] transition hover:opacity-90"
              >
                ➤
              </button>
            </div>
          </div>

          <div className="relative border-t border-[var(--hairline)] bg-[var(--canvas-soft)] px-4 py-2 text-[10px] text-[var(--mute)]">
            AI responses may be incorrect. Verify important information.
          </div>

          <style jsx>{`
            .shimmer {
              position: relative;
              overflow: hidden;
            }
            .shimmer::after {
              content: "";
              position: absolute;
              top: 0;
              left: -150px;
              height: 100%;
              width: 150px;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(161, 161, 161, 0.18),
                transparent
              );
              animation: shimmer 1.2s infinite;
            }
            @keyframes shimmer {
              100% {
                transform: translateX(300px);
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
