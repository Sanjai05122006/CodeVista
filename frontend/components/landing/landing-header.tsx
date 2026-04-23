"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Code2, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function getUserInitial(user: User | null) {
  const displayName = user?.user_metadata?.display_name as string | undefined;
  const fallback = displayName || user?.email || "C";

  return fallback.charAt(0).toUpperCase();
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/editor", label: "Editor" },
  { href: "/history", label: "Editor History" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export function LandingHeader({ user }: { user: User | null }) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)]">
            <Code2 size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-gray-700">
              CodeVista
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
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
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#c7d2fe] hover:bg-[#f8faff]"
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
            <ProfileMenu user={user} onSignOut={handleSignOut} compact />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
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

function ProfileMenu({
  user,
  onSignOut,
  compact = false,
}: {
  user: User;
  onSignOut: () => Promise<void>;
  compact?: boolean;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-white/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur transition hover:border-[#c7d2fe]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#4f46e5] text-sm font-semibold text-white">
          {getUserInitial(user)}
        </div>
        {!compact && (
          <div className="max-w-[180px] text-left">
            <p className="truncate text-sm font-medium text-gray-700">
              {user.user_metadata?.display_name || "Signed in"}
            </p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
        )}
        <ChevronDown
          size={16}
          className="text-gray-400 transition group-open:rotate-180"
        />
      </summary>

      <div className="absolute right-0 z-20 mt-3 w-60 rounded-3xl border border-[#e5e7eb] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
        <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
          <p className="text-sm font-semibold text-[#111827]">
            {user.user_metadata?.display_name || "Signed in"}
          </p>
          <p className="mt-1 text-xs text-gray-500">{user.email}</p>
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
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-[#f8faff] hover:text-[#4f46e5]"
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
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-[#f8faff] hover:text-[#4f46e5]"
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
      className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-[#eef2ff] hover:text-[#4f46e5]"
    >
      {children}
    </Link>
  );
}
