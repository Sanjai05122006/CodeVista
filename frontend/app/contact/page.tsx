"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  ChevronDown,
  Mail,
  MessageCircle,
  PencilLine,
  Send,
  ShieldCheck,
  Tag,
  User,
  Zap,
} from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";
import { StatusCard } from "@/components/ui/StatusCard";
import { buildApiUrl } from "@/lib/api";

const defaultSubject = "CodeVista support request";
const contactSendEndpoint = buildApiUrl("/contact/send");

type FeedbackState = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type ContactSendResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

const trustCards = [
  {
    icon: <MessageCircle size={18} />,
    title: "Real People",
    description: "Talk to our product team",
  },
  {
    icon: <Zap size={18} />,
    title: "Fast Response",
    description: "We typically reply within 24 hours",
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Your Data is Safe",
    description: "We respect your privacy and never share data",
  },
] as const;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim() || defaultSubject;
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setFeedback({
        tone: "error",
        title: "Please fill in the form",
        message: "Add your name, email, and message before sending.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(contactSendEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ContactSendResponse
        | null;
      const successful = response.ok && data?.ok !== false && !data?.error;

      if (!successful) {
        setFeedback({
          tone: "error",
          title: "We couldn’t send your message",
          message:
            data?.message ||
            "We could not send your message right now. Please try again.",
        });

        return;
      }

      setFeedback({
        tone: "success",
        title: "Message received",
        message:
          data?.message ||
          "We received your message and will reply by email as soon as possible.",
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setFeedback({
        tone: "error",
        title: "We couldn’t send your message",
        message:
          "We could not reach the message service. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageFrame headerVariant="site" footerVariant="site">
      <main className="px-6 py-10 pb-16 text-[var(--ink)] lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <section className="grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-start">
            <div className="max-w-2xl pt-4 lg:pt-12">
              <p className="font-mono-ui text-[13px] uppercase tracking-[0.32em] text-slate-500">
                Contact
              </p>
              <h1 className="font-display mt-5 max-w-[10ch] text-[clamp(1.75rem,7vw,4.8rem)] font-semibold tracking-[-2px] text-slate-950 sm:text-[4.8rem] sm:leading-[0.96]">
                Let&apos;s build something better together.
              </h1>
              <p className="mt-8 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Have a question, found a bug, or want to suggest a feature?
                We&apos;d love to hear from you. Our team usually responds
                within 24 hours.
              </p>
            </div>

            <div className="grid gap-4 lg:max-w-[360px] lg:justify-self-end lg:pt-12">
              {trustCards.map((card) => (
                <TrustCard key={card.title} {...card} />
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-[clamp(1.75rem,5vw,2.3rem)] font-semibold tracking-[-0.96px] text-slate-950">
                Send us a message
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Fill in the details below and we&apos;ll get back to you.
              </p>
            </div>

            {feedback ? (
              <div className="mt-6">
                <StatusCard
                  tone={feedback.tone}
                  title={feedback.title}
                  message={feedback.message}
                  onDismiss={() => setFeedback(null)}
                />
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldFrame label="Your name" icon={<User size={18} />}>
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="h-14 w-full rounded-[14px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </FieldFrame>

                <FieldFrame label="Email address" icon={<Mail size={18} />}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="h-14 w-full rounded-[14px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </FieldFrame>
              </div>

              <FieldFrame
                label="Subject (optional)"
                icon={<Tag size={18} />}
                rightIcon={<ChevronDown size={16} />}
              >
                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="h-14 w-full appearance-none rounded-[14px] border border-slate-200 bg-white pl-12 pr-12 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                >
                  <option value="">Select a topic</option>
                  <option value="feature">Feature suggestion</option>
                  <option value="bug">Bug report</option>
                  <option value="account">Account help</option>
                  <option value="general">General question</option>
                </select>
              </FieldFrame>

              <FieldFrame label="Your message" icon={<PencilLine size={18} />} multiline>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what happened or what you need help with..."
                  className="min-h-[230px] w-full rounded-[14px] border border-slate-200 bg-white pl-12 pr-4 pt-4 text-[15px] leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                />
              </FieldFrame>

              <div className="flex items-center gap-2 text-[14px] text-slate-500">
                <ShieldCheck size={16} />
                <span>We will use your email only to reply to your message.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[16px] bg-slate-950 px-8 text-[16px] font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} />
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </PublicPageFrame>
  );
}

function FieldFrame({
  label,
  icon,
  rightIcon,
  multiline = false,
  children,
}: {
  label: string;
  icon: ReactNode;
  rightIcon?: ReactNode;
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[15px] font-semibold text-slate-950">{label}</span>
      <div className="relative">
        <div
          className={`pointer-events-none absolute left-4 ${multiline ? "top-4" : "top-1/2 -translate-y-1/2"} text-slate-500`}
        >
          {icon}
        </div>
        {rightIcon ? (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        ) : null}
        {children}
      </div>
    </label>
  );
}

function TrustCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-50 text-slate-950">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-[14px] leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}
