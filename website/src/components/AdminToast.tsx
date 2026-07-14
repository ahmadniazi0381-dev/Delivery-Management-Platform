"use client";

/**
 * AdminToast — Lightweight toast notification stack for the Admin Dashboard.
 *
 * Usage:
 *   const { addToast } = useToast();
 *   addToast({ type: 'success', title: 'Order Accepted', message: '#1024 is being prepared.' });
 *
 * Types: 'success' | 'error' | 'warning' | 'info'
 * Auto-dismisses after 5 seconds. Max 4 visible toasts.
 * No external dependency.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider + Stack ─────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${++counterRef.current}`;
      const duration = toast.duration ?? 5000;

      setToasts((prev) => {
        // Max 4 visible — drop oldest if needed
        const next = [...prev, { ...toast, id }];
        return next.length > 4 ? next.slice(next.length - 4) : next;
      });

      // Auto-dismiss
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Stack UI ─────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)", icon: "#10b981", bar: "#10b981" },
  error:   { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  icon: "#ef4444", bar: "#ef4444" },
  warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)", icon: "#f59e0b", bar: "#f59e0b" },
  info:    { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", icon: "#3b82f6", bar: "#3b82f6" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const colors = COLORS[toast.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: "var(--bg-card, #1e1e2e)",
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.bar}`,
        borderRadius: "10px",
        padding: "14px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        minWidth: "300px",
        maxWidth: "420px",
        position: "relative",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <span style={{ color: colors.icon, marginTop: "1px", flexShrink: 0 }}>
        {ICONS[toast.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary, #fff)" }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary, #aaa)", marginTop: "3px", lineHeight: 1.4 }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary, #aaa)",
          padding: "2px",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
