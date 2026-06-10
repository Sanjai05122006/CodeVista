import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";

type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "loading";
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
  onDismiss?: () => void;
  dismissLabel?: string;
};

const toneConfig = {
  light: {
    neutral: {
      wrapper: "border-slate-200 bg-white text-[var(--ink)]",
      icon: "border-slate-200 bg-slate-50 text-[var(--ink)]",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    },
    info: {
      wrapper: "border-sky-200 bg-white text-[var(--ink)]",
      icon: "border-sky-200 bg-sky-50 text-sky-700",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-sky-600 hover:bg-sky-50 hover:text-sky-700",
    },
    success: {
      wrapper: "border-emerald-200 bg-white text-[var(--ink)]",
      icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
    },
    warning: {
      wrapper: "border-amber-200 bg-white text-[var(--ink)]",
      icon: "border-amber-200 bg-amber-50 text-amber-700",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-amber-600 hover:bg-amber-50 hover:text-amber-700",
    },
    error: {
      wrapper: "border-rose-200 bg-white text-[var(--ink)]",
      icon: "border-rose-200 bg-rose-50 text-rose-700",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
    },
    loading: {
      wrapper: "border-sky-200 bg-white text-[var(--ink)]",
      icon: "border-sky-200 bg-sky-50 text-sky-700",
      title: "text-[var(--ink)]",
      body: "text-[var(--body)]",
      dismiss: "text-sky-600 hover:bg-sky-50 hover:text-sky-700",
    },
  },
  dark: {
    neutral: {
      wrapper: "border-slate-800 bg-slate-950 text-white",
      icon: "border-white/10 bg-white/5 text-white",
      title: "text-white",
      body: "text-slate-200",
      dismiss: "text-slate-300 hover:bg-white/5 hover:text-white",
    },
    info: {
      wrapper: "border-sky-400/20 bg-slate-950 text-white",
      icon: "border-sky-400/20 bg-sky-500/10 text-sky-200",
      title: "text-white",
      body: "text-sky-100/90",
      dismiss: "text-sky-200 hover:bg-sky-500/10 hover:text-white",
    },
    success: {
      wrapper: "border-emerald-400/20 bg-slate-950 text-white",
      icon: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
      title: "text-white",
      body: "text-emerald-100/90",
      dismiss: "text-emerald-200 hover:bg-emerald-500/10 hover:text-white",
    },
    warning: {
      wrapper: "border-amber-400/20 bg-slate-950 text-white",
      icon: "border-amber-400/20 bg-amber-500/10 text-amber-200",
      title: "text-white",
      body: "text-amber-100/90",
      dismiss: "text-amber-200 hover:bg-amber-500/10 hover:text-white",
    },
    error: {
      wrapper: "border-rose-400/20 bg-slate-950 text-white",
      icon: "border-rose-400/20 bg-rose-500/10 text-rose-200",
      title: "text-white",
      body: "text-rose-100/90",
      dismiss: "text-rose-200 hover:bg-rose-500/10 hover:text-white",
    },
    loading: {
      wrapper: "border-sky-400/20 bg-slate-950 text-white",
      icon: "border-sky-400/20 bg-sky-500/10 text-sky-200",
      title: "text-white",
      body: "text-sky-100/90",
      dismiss: "text-sky-200 hover:bg-sky-500/10 hover:text-white",
    },
  },
} satisfies Record<
  StatusVariant,
  Record<
    StatusTone,
    {
      wrapper: string;
      icon: string;
      title: string;
      body: string;
      dismiss: string;
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
  onDismiss,
  dismissLabel = "Close",
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
      className={`relative border ${styles.wrapper} ${className}`}
    >
      <div
        className={`flex items-start gap-4 ${compact ? "px-4 py-4" : "px-5 py-5 lg:px-6 lg:py-6"}`}
      >
        <div
          className={`flex shrink-0 items-center justify-center border ${compact ? "h-10 w-10" : "h-12 w-12"} ${styles.icon}`}
          aria-hidden="true"
        >
          {resolvedIcon}
        </div>

        <div className="min-w-0 flex-1">
          {title ? (
            <p
              className={`font-display text-base font-semibold tracking-[-0.48px] ${styles.title} ${compact ? "" : "sm:text-[17px]"}`}
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

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className={`flex h-9 w-9 shrink-0 items-center justify-center border ${styles.dismiss} transition`}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
