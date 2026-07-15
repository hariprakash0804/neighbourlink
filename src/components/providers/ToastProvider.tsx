"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// ─── Variant Config ───────────────────────────────────────────────────────────
const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconColor: string; borderColor: string; bgAccent: string }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgAccent: "bg-emerald-500/5",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-400",
    borderColor: "border-red-500/30",
    bgAccent: "bg-red-500/5",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgAccent: "bg-amber-500/5",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgAccent: "bg-blue-500/5",
  },
};

// ─── Single Toast Component ───────────────────────────────────────────────────
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative w-80 max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden",
        "glass-strong shadow-elevated",
        "border",
        config.borderColor
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className={cn("flex items-start gap-3 p-4", config.bgAccent)}>
        <div className="shrink-0 mt-0.5">
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5 text-text-muted" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options.duration ?? 4000;

      setToasts((prev) => [...prev, { ...options, id }]);

      // Auto-dismiss
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const contextValue: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ variant: "success", title, description }),
    error: (title, description) => addToast({ variant: "error", title, description }),
    warning: (title, description) => addToast({ variant: "warning", title, description }),
    info: (title, description) => addToast({ variant: "info", title, description }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast container — fixed at bottom right */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none lg:bottom-8 lg:right-8"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
