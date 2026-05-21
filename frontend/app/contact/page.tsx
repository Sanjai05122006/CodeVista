"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/public-page-frame";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "sanjai05126@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const canSubmit = name.trim() && email.trim() && message.trim();

  const mailtoHref = useMemo(() => {
    if (!canSubmit) {
      return null;
    }

    const subject = encodeURIComponent("CodeVista support request");
    const body = encodeURIComponent(
      [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        "",
        "Message:",
        message.trim(),
      ].join("\n")
    );

    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [canSubmit, email, message, name]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setShowValidation(true);
      return;
    }

    setShowValidation(false);
    setDraftReady(true);
  };

  return (
    <PublicPageFrame headerVariant="landing">
      <main className="px-6 py-10 pb-16 text-[var(--ink)] lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl justify-center">
          <section className="cv-shadow-lg w-full max-w-2xl rounded-2xl border border-[var(--hairline)] bg-white p-8 lg:p-10">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]">
                <Mail size={20} />
              </div>
              <p className="font-mono-ui mt-4 text-[12px] text-[var(--mute)]">
                Contact
              </p>
              <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-1.28px] text-[var(--ink)] sm:text-5xl">
                How can we help?
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--body)]">
                Share your question or the problem you faced while using
                CodeVista. Keep it simple and tell us what happened.
              </p>
            </div>

            {draftReady && mailtoHref ? (
              <div className="mt-10 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-soft)] p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--on-primary)]">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="font-display mt-4 text-2xl font-semibold tracking-[-0.72px] text-[var(--ink)]">
                  Your message is ready.
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--body)]">
                  We prepared your support email for {supportEmail}. Open your
                  email app, review the draft, and send it when you are ready.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={mailtoHref}
                    className="inline-flex h-12 items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
                  >
                    Open email draft
                  </a>
                  <button
                    type="button"
                    onClick={() => setDraftReady(false)}
                    className="inline-flex h-12 items-center justify-center rounded-[100px] border border-[var(--hairline)] bg-white px-6 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
                  >
                    Edit message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name">
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter your name"
                      className="h-11 w-full rounded-md border border-[var(--hairline)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
                    />
                  </Field>

                  <Field label="Email address">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="h-11 w-full rounded-md border border-[var(--hairline)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
                    />
                  </Field>
                </div>

                <Field label="Your message">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what happened or what you need help with."
                    className="min-h-[180px] w-full rounded-md border border-[var(--hairline)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--ink)]"
                  />
                </Field>

                {showValidation && !canSubmit ? (
                  <p className="text-sm text-red-600">
                    Fill in your name, email, and message before submitting.
                  </p>
                ) : null}

                <p className="text-sm text-[var(--body)]">
                  We will use your email only to reply to your message.
                </p>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-[100px] bg-[var(--ink)] px-6 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Prepare message
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </PublicPageFrame>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}
