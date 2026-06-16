"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export type ToastTone = "success" | "error" | "warning" | "info";

type ToastInput = {
  tone?: ToastTone;
  title: string;
  message?: string;
  /** Milliseconds before auto-dismiss. Pass 0 to keep until dismissed. */
  duration?: number;
};

type Toast = Required<Pick<ToastInput, "tone">> & ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4200;

const toneStyles: Record<
  ToastTone,
  { card: string; icon: ReactNode; ring: string }
> = {
  success: {
    card: "bg-gradient-to-br from-emerald-500 to-green-600 text-white",
    ring: "ring-1 ring-inset ring-white/20 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.65)]",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: {
    card: "bg-gradient-to-br from-rose-500 to-red-600 text-white",
    ring: "ring-1 ring-inset ring-white/20 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.65)]",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  warning: {
    card: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    ring: "ring-1 ring-inset ring-white/20 shadow-[0_16px_40px_-12px_rgba(245,158,11,0.6)]",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  info: {
    card: "bg-gradient-to-br from-sky-500 to-indigo-600 text-white",
    ring: "ring-1 ring-inset ring-white/20 shadow-[0_16px_40px_-12px_rgba(59,130,246,0.6)]",
    icon: <Info className="h-5 w-5" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      const tone = input.tone ?? "info";
      const duration = input.duration ?? DEFAULT_DURATION;

      setToasts((current) => [...current, { ...input, tone, id }]);

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-center gap-3 px-4 py-6 sm:items-end sm:px-6">
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <ToastCard
            key={item.id}
            toast={item}
            onDismiss={() => onDismiss(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const styles = toneStyles[toast.tone];

  return (
    <motion.div
      layout
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3.5 ${styles.card} ${styles.ring}`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {styles.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5">{toast.title}</p>
        {toast.message ? (
          <p className="mt-0.5 text-[13px] leading-5 text-white/90">
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
