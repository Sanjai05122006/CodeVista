"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Code2, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function getUserInitial(user: User | null) {
  const displayName = user?.user_metadata?.display_name as string | undefined;
  const fallback = displayName || user?.email || "C";

  return fallback.charAt(0).toUpperCase();
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/editor", label: "Editor" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

type LandingHeaderProps = {
  user: User | null;
  variant?: "legacy" | "landing";
};

export function LandingHeader({
  user,
  variant = "legacy",
}: LandingHeaderProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  if (variant === "landing") {
    return (
      <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-white/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--hairline)] bg-white text-[var(--ink)] cv-shadow-sm">
              <Code2 size={16} />
            </div>
            <div>
              <p className="font-display text-[18px] font-semibold tracking-[-0.54px] text-[var(--ink)]">
                CodeVista
              </p>
              <p className="font-mono-ui text-[12px] text-[var(--mute)]">
                developer intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <LandingNavLink key={item.href} href={item.href}>
                {item.label}
              </LandingNavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <LandingProfileMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center rounded-md border border-[var(--hairline)] bg-white px-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-8 items-center rounded-md bg-[var(--ink)] px-3 text-sm font-medium text-[var(--on-primary)] transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--hairline)] lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
            {navItems.map((item) => (
              <LandingNavLink key={item.href} href={item.href}>
                {item.label}
              </LandingNavLink>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <LandingProfileMenu user={user} onSignOut={handleSignOut} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-8 items-center rounded-md border border-[var(--hairline)] bg-white px-3 text-sm font-medium text-[var(--ink)]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-8 items-center rounded-md bg-[var(--ink)] px-3 text-sm font-medium text-[var(--on-primary)]"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)]">
            <Code2 size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              CodeVista
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--mute)]">
              Learn code visually
            </p>
          </div>
        </Link>

        <nav className="hidden items-center rounded-full border border-white/70 bg-white/80 px-3 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur lg:flex">
          {navItems.map((item) => (
            <HeaderNavLink key={item.href} href={item.href}>
              {item.label}
            </HeaderNavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <ProfileMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-[var(--hairline)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--canvas-soft)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-5 py-2.5 text-sm font-medium text-white shadow-[0_16px_38px_rgba(99,102,241,0.3)] transition hover:opacity-95"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
        {navItems.map((item) => (
          <HeaderNavLink key={item.href} href={item.href}>
            {item.label}
          </HeaderNavLink>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <ProfileMenu user={user} onSignOut={handleSignOut} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-[var(--hairline)] bg-white px-4 py-2 text-sm font-medium text-[var(--ink)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#4f46e5] px-4 py-2 text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function LandingNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-sm text-[var(--body)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
    >
      {children}
    </Link>
  );
}

function LandingProfileMenu({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--hairline)] bg-white px-2.5 py-2 text-sm text-[var(--ink)] cv-shadow-sm transition hover:bg-[var(--canvas-soft)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-[12px] font-medium text-[var(--on-primary)]">
          {getUserInitial(user)}
        </div>
        <span className="hidden sm:inline">
          {user.user_metadata?.display_name || "Account"}
        </span>
      </summary>

      <div className="cv-shadow-lg absolute right-0 z-20 mt-3 w-60 rounded-xl border border-[var(--hairline)] bg-white p-2">
        <div className="rounded-lg bg-[var(--canvas-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--ink)]">
            {user.user_metadata?.display_name || "Signed in"}
          </p>
          <p className="mt-1 text-xs text-[var(--mute)]">{user.email}</p>
        </div>

        <div className="mt-2 grid gap-1">
          <LandingMenuLink href="/settings" icon={<Settings size={16} />}>
            Settings
          </LandingMenuLink>
          <button
            type="button"
            onClick={() => {
              void onSignOut();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-[var(--body)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </details>
  );
}

function LandingMenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--body)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
    >
      {icon}
      {children}
    </Link>
  );
}

function ProfileMenu({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => Promise<void>;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center rounded-full border border-white/70 bg-white/85 p-2 shadow-sm backdrop-blur transition hover:border-[#c7d2fe]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-sm font-semibold text-white">
          {getUserInitial(user)}
        </div>
      </summary>

      <div className="absolute right-0 z-20 mt-3 w-60 rounded-3xl border border-[#e5e7eb] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
        <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {user.user_metadata?.display_name || "Signed in"}
          </p>
          <p className="mt-1 text-xs text-[var(--mute)]">{user.email}</p>
        </div>

        <div className="mt-2 grid gap-1">
          <MenuLink href="/settings" icon={<Settings size={16} />}>
            Settings
          </MenuLink>
          <button
            type="button"
            onClick={() => {
              void onSignOut();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-[var(--body)] transition hover:bg-[#f8faff] hover:text-[#4f46e5]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </details>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--body)] transition hover:bg-[#f8faff] hover:text-[#4f46e5]"
    >
      {icon}
      {children}
    </Link>
  );
}

function HeaderNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-medium text-[var(--body)] transition hover:bg-[#eef2ff] hover:text-[#4f46e5]"
    >
      {children}
    </Link>
  );
}
