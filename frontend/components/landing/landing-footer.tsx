"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Code2, Mail } from "lucide-react";
import { StatusCard } from "@/components/ui/StatusCard";
import { useAuth } from "@/lib/auth-context";

const currentYear = new Date().getFullYear();
const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL?.trim() ||
  "https://github.com/Sanjai05122006";
const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "sanjai05126@gmail.com";

type LandingFooterProps = {
  variant?: "legacy" | "landing" | "site";
};

type FooterTone = "default" | "site";

const footerLinks = [
  {
    title: "Product",
    items: [
      { href: "/editor", label: "Editor" },
      { href: "/history", label: "History" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Access",
    items: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Sign up" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/contact", label: "Contact" },
      { href: githubUrl, label: "GitHub" },
      { href: `mailto:${supportEmail}`, label: "Support email" },
    ],
  },
];

export function LandingFooter({
  variant = "legacy",
}: LandingFooterProps) {
  const { user } = useAuth();
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeFeedback, setSubscribeFeedback] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const visibleFooterLinks = user
    ? footerLinks
    : footerLinks.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.href !== "/history" && item.href !== "/settings"
        ),
      }));

  const handleSubscribeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const trimmedEmail = subscribeEmail.trim();
    if (!trimmedEmail) {
      form.reportValidity();
      return;
    }

    setSubscribeFeedback({
      title: "You're subscribed",
      message:
        "Thanks for subscribing. We’ll send product updates and improvements to that email address.",
    });
    setSubscribeEmail("");
  };

  if (variant === "site") {
    return (
      <>
        {subscribeFeedback ? (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div className="pointer-events-auto w-full max-w-[420px]">
              <StatusCard
                tone="success"
                variant="light"
                compact
                title={subscribeFeedback.title}
                message={subscribeFeedback.message}
                onDismiss={() => setSubscribeFeedback(null)}
              />
            </div>
          </div>
        ) : null}

        <footer className="mt-auto border-t border-white/10 bg-[#090b0f] text-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-8 sm:py-14 lg:px-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]">
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-slate-950 shadow-[0_14px_28px_rgba(255,255,255,0.08)] sm:h-12 sm:w-12">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <div className="leading-none">
                    <p className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
                      CodeVista
                    </p>
                    <p className="mt-1 text-[10px] tracking-[0.08em] text-white/60 sm:text-[12px]">
                      developer intelligence
                    </p>
                  </div>
                </div>

                <p className="mt-5 max-w-[360px] text-[14px] leading-[1.8] text-white/75 sm:mt-6 sm:text-[16px]">
                  From writing code to understanding it deeply - all in one
                  intelligent platform.
                </p>

                <div className="mt-7 flex items-center gap-4 sm:mt-8">
                  <SocialLink
                    href={githubUrl}
                    label="GitHub"
                    icon={<GitHubIcon />}
                    tone="site"
                  />
                  <SocialLink
                    href="https://x.com"
                    label="X"
                    icon={<XIcon />}
                    tone="site"
                  />
                  <SocialLink
                    href={`mailto:${supportEmail}`}
                    label="Email"
                    icon={<Mail className="h-5 w-5" />}
                    tone="site"
                  />
                </div>
              </div>

              <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-5">
                {visibleFooterLinks.map((group) => (
                  <details key={group.title} className="group sm:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/75 transition hover:bg-white/5 hover:text-white [&::-webkit-details-marker]:hidden">
                      <span>{group.title}</span>
                      <span className="text-white/40 transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="mt-3 grid gap-2 pb-2">
                      {group.items.map((item) => (
                        <FooterLink
                          key={item.label}
                          href={item.href}
                          label={item.label}
                          tone="site"
                        />
                      ))}
                    </div>
                  </details>
                ))}

                {visibleFooterLinks.map((group) => (
                  <div key={group.title} className="hidden sm:block">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {group.title}
                    </p>
                    <div className="mt-5 grid gap-2">
                      {group.items.map((item) => (
                        <FooterLink
                          key={item.label}
                          href={item.href}
                          label={item.label}
                          tone="site"
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-2 xl:col-span-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">
                    Stay in the loop
                  </p>
                  <p className="mt-5 max-w-[340px] text-[14px] leading-[1.8] text-white/78 sm:text-[15px]">
                    Get updates about new features and improvements.
                  </p>

                  <form
                    onSubmit={handleSubscribeSubmit}
                    className="mt-6 flex w-full max-w-[366px] flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <input
                      type="email"
                      required
                      value={subscribeEmail}
                      onChange={(event) => setSubscribeEmail(event.target.value)}
                      placeholder="Enter your email"
                      aria-label="Email address for newsletter subscription"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none transition focus:border-white/20 sm:min-w-0 sm:flex-1 sm:text-[15px]"
                    />
                    <button
                      type="submit"
                      className="inline-flex h-12 min-w-[118px] items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-950 transition hover:bg-white/90 sm:shrink-0 sm:text-[15px]"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-6 text-center text-[13px] text-white/65 sm:mt-12 sm:pt-8 sm:text-[14px]">
              © {currentYear} CodeVista. All rights reserved.
            </div>
          </div>
        </footer>
      </>
    );
  }

  if (variant === "landing") {
    return (
      <footer className="mt-auto border-t border-[var(--hairline)] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_1.9fr] lg:px-10">
          <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--hairline)] bg-white text-[var(--ink)] cv-shadow-sm">
                  <Code2 size={16} />
                </div>
                <div>
                  <p className="font-display text-[16px] font-semibold tracking-[-0.54px] text-[var(--ink)] sm:text-[18px]">
                    CodeVista
                  </p>
                <p className="font-mono-ui text-[11px] text-[var(--mute)] sm:text-[12px]">
                  code understanding workspace
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--body)]">
              Execution, analysis, visualization, and session memory arranged
              as one product surface.
            </p>
            <p className="mt-5 text-sm text-[var(--mute)]">
              Copyright {currentYear} CodeVista
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {visibleFooterLinks.map((group) => (
              <div key={group.title}>
                <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                  {group.title}
                </p>
                <div className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <FooterLink
                      key={item.label}
                      href={item.href}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-[var(--hairline)] bg-[var(--canvas)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ink)] text-[var(--on-primary)] cv-shadow-sm">
            <Code2 size={18} />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-[var(--ink)] sm:text-lg">
              CodeVista
            </p>
            <p className="text-[10px] text-[var(--body)] sm:text-sm">
              Copyright {currentYear} CodeVista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SocialLink
            href={githubUrl}
            label="GitHub"
            icon={<GitHubIcon />}
          />
          <SocialLink
            href="https://x.com"
            label="X"
            icon={<XIcon />}
          />
          <SocialLink
            href={`mailto:${supportEmail}`}
            label="Email"
            icon={<Mail size={18} />}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  label,
  tone = "default",
}: {
  href: string;
  label: string;
  tone?: FooterTone;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const baseClass =
    tone === "site"
      ? "flex items-center justify-between rounded-xl px-3 py-2 text-[14px] font-medium text-white/85 transition hover:-translate-x-0.5 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      : "text-sm text-[var(--body)] transition hover:text-[var(--ink)]";

  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={baseClass}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={baseClass}
    >
      {label}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  icon,
  tone = "default",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone?: FooterTone;
}) {
  const isHttp = href.startsWith("http");
  const className =
    tone === "site"
      ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
      : "flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--body)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]";

  return (
    <a
      href={href}
      target={isHttp ? "_blank" : undefined}
      rel={isHttp ? "noreferrer" : undefined}
      aria-label={label}
      className={className}
    >
      {icon}
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-current"
      aria-hidden="true"
    >
      <path d="M12 .5C5.648.5.5 5.648.5 12a11.5 11.5 0 0 0 7.86 10.914c.575.106.785-.25.785-.555 0-.274-.01-1-.015-1.963-3.197.695-3.872-1.541-3.872-1.541-.523-1.328-1.278-1.681-1.278-1.681-1.044-.714.079-.699.079-.699 1.155.081 1.762 1.186 1.762 1.186 1.026 1.759 2.692 1.251 3.349.957.104-.744.402-1.251.731-1.539-2.552-.29-5.236-1.276-5.236-5.68 0-1.255.449-2.281 1.184-3.085-.119-.29-.513-1.458.112-3.04 0 0 .966-.309 3.167 1.179a10.98 10.98 0 0 1 5.766 0c2.2-1.488 3.165-1.179 3.165-1.179.626 1.582.232 2.75.114 3.04.737.804 1.183 1.83 1.183 3.085 0 4.414-2.688 5.387-5.25 5.671.413.356.781 1.058.781 2.134 0 1.541-.014 2.782-.014 3.161 0 .308.207.667.79.554A11.502 11.502 0 0 0 23.5 12C23.5 5.648 18.352.5 12 .5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-current"
      aria-hidden="true"
    >
      <path d="M4.2 4h4.15l4.32 5.8L17.48 4H21l-6.55 8.26L21.8 20h-4.14l-4.73-6.34L7.98 20H4.46l6.93-8.75L4.2 4Zm12.82 14h1.2L7.32 5.83H6.1L17.02 18Z" />
    </svg>
  );
}
