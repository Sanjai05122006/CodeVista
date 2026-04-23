import Link from "next/link";
import { Code2, Mail } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/60 bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_55%,#ffffff_100%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)]">
              <Code2 size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-gray-700">
                CodeVista
              </p>
              <p className="text-sm text-gray-500">
                A cleaner way to write, visualize, and understand code.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-gray-600 transition hover:border-[#c7d2fe] hover:text-[#4f46e5]"
            >
              <GitHubIcon />
            </a>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-gray-500">
              <Mail size={16} className="text-[#6366f1]" />
              Gmail support coming soon
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-gray-500 sm:grid-cols-2">
          <FooterLink href="/">Home</FooterLink>
          <FooterLink href="/editor">Editor</FooterLink>
          <FooterLink href="/history">Editor History</FooterLink>
          <FooterLink href="/about">About Us</FooterLink>
          <FooterLink href="/contact">Contact Us</FooterLink>
          <FooterLink href="/settings">Settings</FooterLink>
        </div>
      </div>
    </footer>
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

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 font-medium text-gray-600 transition hover:border-[#c7d2fe] hover:text-[#4f46e5]"
    >
      {children}
    </Link>
  );
}
