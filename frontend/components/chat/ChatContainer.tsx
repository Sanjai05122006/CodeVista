"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import { useLocalChat } from "@/hooks/useLocalChat";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import {
  PersistedChatMessage,
  useChatPersistence,
} from "@/hooks/useChatPersistence";

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
  const [status, setStatus] = useState<"saved" | "syncing" | "error">("saved");
  const [stream, setStream] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const timerRef = useRef<number | null>(null);
  const { messages, setMessages, loaded } = useLocalChat(threadId, initialMessages);
  const { add, flush } = useChatPersistence({
    threadId,
    title,
    sessionId,
    accessToken,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (loadingAI) {
      setStatus("syncing");
    } else {
      setStatus("saved");
    }
  }, [loadingAI]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingAI, stream, open]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      void flush();
    };
  }, [flush]);

  const typed = useTypingEffect(stream);

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || loadingAI) {
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
    setStatus("syncing");
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
        setStatus("saved");
      }, Math.min(Math.max(formattedReply.length * 10, 600), 2200));
    } catch (requestError) {
      setLoadingAI(false);
      setStatus("error");
      setStream("");
      setError("Unable to get a reply right now. Please try again.");
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl sm:bottom-8 sm:right-8"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex h-[620px] max-h-[78vh] w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f1a]/90 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:bottom-8 sm:right-8"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />

          <div className="relative flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
            <div>
              <div className="font-semibold">CodeVista AI</div>
              <div className="text-xs opacity-80">Your code-aware assistant</div>
            </div>

            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="relative flex items-center gap-2 px-4 py-2 text-xs text-white/60">
            {status === "saved" && (
              <>
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Saved
              </>
            )}
            {status === "syncing" && (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                Syncing...
              </>
            )}
            {status === "error" && (
              <>
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Connection issue
              </>
            )}
          </div>

          <div className="relative flex-1 space-y-3 overflow-y-auto px-4 py-3">
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
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "border border-white/10 bg-white/10 text-white backdrop-blur"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {loadingAI && !stream && (
              <div className="flex justify-start">
                <div className="w-[200px] max-w-[75%] rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <div className="space-y-2">
                    <div className="shimmer h-3 rounded bg-white/10" />
                    <div className="shimmer h-3 w-4/5 rounded bg-white/10" />
                    <div className="shimmer h-3 w-2/3 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            )}

            {stream && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
                  <div className="whitespace-pre-wrap">{typed}</div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="relative border-t border-white/10 bg-[#0b0f1a]/80 p-3 backdrop-blur">
            {error ? (
              <div className="mb-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <input
                disabled={!loaded}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about your code..."
                className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
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
                className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white"
              >
                ➤
              </button>
            </div>
          </div>

          <div className="relative px-4 py-2 text-[10px] text-white/40">
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
                rgba(255, 255, 255, 0.25),
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
