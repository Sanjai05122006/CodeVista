import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react";

type StatusTone = "neutral" | "info" | "success" | "warning" | "error" | "loading";
type StatusVariant = "light" | "dark";

type StatusCardProps = {
  tone?: StatusTone;
  variant?: StatusVariant;
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
  role?: "status" | "alert";
};

const toneConfig = {
  light: {
    neutral: {
      wrapper: "border-white/70 bg-white/78 text-[var(--ink)] shadow-[0_18px_42px_rgba(15,23,42,0.08)]",
      overlay: "from-slate-50/90 via-transparent to-white/0",
      icon: "border-[var(--hairline)] bg-[var(--canvas-soft)] text-[var(--ink)]",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
    info: {
      wrapper: "border-sky-200/70 bg-white/80 text-[var(--ink)] shadow-[0_18px_42px_rgba(56,189,248,0.08)]",
      overlay: "from-sky-50/90 via-transparent to-white/0",
      icon: "border-sky-200/80 bg-sky-50 text-sky-600",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
    success: {
      wrapper: "border-emerald-200/70 bg-white/80 text-[var(--ink)] shadow-[0_18px_42px_rgba(16,185,129,0.08)]",
      overlay: "from-emerald-50/90 via-transparent to-white/0",
      icon: "border-emerald-200/80 bg-emerald-50 text-emerald-600",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
    warning: {
      wrapper: "border-amber-200/70 bg-white/80 text-[var(--ink)] shadow-[0_18px_42px_rgba(245,158,11,0.08)]",
      overlay: "from-amber-50/90 via-transparent to-white/0",
      icon: "border-amber-200/80 bg-amber-50 text-amber-600",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
    error: {
      wrapper: "border-rose-200/70 bg-white/80 text-[var(--ink)] shadow-[0_18px_42px_rgba(244,63,94,0.08)]",
      overlay: "from-rose-50/90 via-transparent to-white/0",
      icon: "border-rose-200/80 bg-rose-50 text-rose-600",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
    loading: {
      wrapper: "border-sky-200/70 bg-white/80 text-[var(--ink)] shadow-[0_18px_42px_rgba(56,189,248,0.08)]",
      overlay: "from-sky-50/90 via-transparent to-white/0",
      icon: "border-sky-200/80 bg-sky-50 text-sky-600",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
    },
  },
  dark: {
    neutral: {
      wrapper: "border-white/10 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-white/6 via-transparent to-transparent",
      icon: "border-white/10 bg-white/5 text-white",
      title: "text-white",
      body: "text-slate-200",
    },
    info: {
      wrapper: "border-sky-400/20 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-sky-500/10 via-transparent to-transparent",
      icon: "border-sky-400/20 bg-sky-500/10 text-sky-200",
      title: "text-white",
      body: "text-sky-100/90",
    },
    success: {
      wrapper: "border-emerald-400/20 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-emerald-500/10 via-transparent to-transparent",
      icon: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      title: "text-white",
      body: "text-emerald-100/90",
    },
    warning: {
      wrapper: "border-amber-400/20 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-amber-500/10 via-transparent to-transparent",
      icon: "border-amber-400/20 bg-amber-500/10 text-amber-200",
      title: "text-white",
      body: "text-amber-100/90",
    },
    error: {
      wrapper: "border-rose-400/20 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-rose-500/10 via-transparent to-transparent",
      icon: "border-rose-400/20 bg-rose-500/10 text-rose-200",
      title: "text-white",
      body: "text-rose-100/90",
    },
    loading: {
      wrapper: "border-sky-400/20 bg-slate-950/78 text-white shadow-[0_22px_48px_rgba(2,6,23,0.45)]",
      overlay: "from-sky-500/10 via-transparent to-transparent",
      icon: "border-sky-400/20 bg-sky-500/10 text-sky-200",
      title: "text-white",
      body: "text-sky-100/90",
    },
  },
} satisfies Record<
  StatusVariant,
  Record<
    StatusTone,
    {
      wrapper: string;
      overlay: string;
      icon: string;
      title: string;
      body: string;
    }
  >
>;

const defaultIcons: Record<StatusTone, ReactNode> = {
  neutral: <Info size={18} />,
  info: <Info size={18} />,
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <AlertCircle size={18} />,
  loading: <Loader2 size={18} className="animate-spin" />,
};

export function StatusCard({
  tone = "neutral",
  variant = "light",
  title,
  message,
  action,
  icon,
  compact = false,
  className = "",
  role,
}: StatusCardProps) {
  const styles = toneConfig[variant][tone];
  const resolvedRole = role ?? (tone === "error" ? "alert" : "status");
  const resolvedLive = tone === "error" ? "assertive" : "polite";
  const resolvedIcon = icon ?? defaultIcons[tone];

  return (
    <section
      role={resolvedRole}
      aria-live={resolvedLive}
      aria-atomic="true"
      className={`relative overflow-hidden rounded-[28px] border backdrop-blur-xl ${styles.wrapper} ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.overlay}`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/60 opacity-80" />
      <div
        className={`relative flex items-start gap-4 ${
          compact ? "px-4 py-4" : "px-5 py-5 lg:px-6 lg:py-6"
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-2xl border ${compact ? "h-10 w-10" : "h-12 w-12"} ${styles.icon}`}
        >
          {resolvedIcon}
        </div>

        <div className="min-w-0 flex-1">
          {title ? (
            <p
              className={`font-display text-base font-semibold tracking-[-0.48px] ${
                styles.title
              } ${compact ? "" : "sm:text-[17px]"}`}
            >
              {title}
            </p>
          ) : null}
          <div
            className={`mt-1 text-sm leading-7 ${styles.body} ${
              compact ? "leading-6" : ""
            }`}
          >
            {message}
          </div>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
