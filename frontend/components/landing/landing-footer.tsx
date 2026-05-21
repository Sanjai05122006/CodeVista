import Link from "next/link";
import { Code2 } from "lucide-react";

const currentYear = new Date().getFullYear();

type LandingFooterProps = {
  variant?: "legacy" | "landing";
};

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
      { href: process.env.NEXT_PUBLIC_GITHUB_URL?.trim() || "https://github.com", label: "Repository" },
      { href: "mailto:" + (process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.com"), label: "Support email" },
    ],
  },
];

export function LandingFooter({
  variant = "legacy",
}: LandingFooterProps) {
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
                <p className="font-display text-[18px] font-semibold tracking-[-0.54px] text-[var(--ink)]">
                  CodeVista
                </p>
                <p className="font-mono-ui text-[12px] text-[var(--mute)]">
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
            {footerLinks.map((group) => (
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
            <p className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              CodeVista
            </p>
            <p className="text-sm text-[var(--body)]">
              Copyright {currentYear} CodeVista
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SocialLink
            href="https://github.com"
            label="GitHub"
            icon={<GitHubIcon />}
          />
          <SocialLink
            href="https://twitter.com"
            label="Twitter"
            icon={<TwitterIcon />}
          />
          <SocialLink
            href="https://instagram.com"
            label="Instagram"
            icon={<InstagramIcon />}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");

  if (isExternal) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className="text-sm text-[var(--body)] transition hover:text-[var(--ink)]"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="text-sm text-[var(--body)] transition hover:text-[var(--ink)]"
    >
      {label}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--body)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
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

function TwitterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-current"
      aria-hidden="true"
    >
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.25l-4.9-6.4L6.46 22H3.35l7.24-8.28L1 2h6.4l4.43 5.86L18.9 2Zm-1.1 18h1.73L6.47 3.9H4.61L17.8 20Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-current"
      aria-hidden="true"
    >
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5ZM17.7 5.15a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 6.6A5.4 5.4 0 1 1 6.6 12 5.4 5.4 0 0 1 12 6.6Zm0 1.8A3.6 3.6 0 1 0 15.6 12 3.6 3.6 0 0 0 12 8.4Z" />
    </svg>
  );
}
