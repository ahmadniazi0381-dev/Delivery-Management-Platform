"use client";
import React from "react";
import { Trash2, CheckCheck, RefreshCw, X, Package } from "lucide-react";

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "primary" | "danger" | "secondary" | "success";
  disabled?: boolean;
  loading?: boolean;
}

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  actions: BulkAction[];
  label?: string;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--saffron)",
    color: "#fff",
    border: "none",
  },
  danger: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  success: {
    background: "#10b981",
    color: "#fff",
    border: "none",
  },
};

export function BulkActionBar({
  selectedIds,
  onClear,
  actions,
  label = "item",
}: BulkActionBarProps) {
  if (selectedIds.length === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        bottom: "20px",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        background: "var(--bg-card)",
        border: "1px solid var(--saffron)",
        borderRadius: "14px",
        padding: "12px 20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        animation: "bulk-in 0.25s ease",
        flexWrap: "wrap",
      }}
    >
      <style>{`
        @keyframes bulk-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Selection info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(245,158,11,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Package size={16} color="var(--saffron)" />
        </div>
        <span
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            fontSize: "0.9rem",
          }}
        >
          {selectedIds.length}{" "}
          {label}
          {selectedIds.length !== 1 ? "s" : ""} selected
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => action.onClick(selectedIds)}
            disabled={action.disabled || action.loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: action.disabled || action.loading ? "not-allowed" : "pointer",
              opacity: action.disabled || action.loading ? 0.6 : 1,
              transition: "opacity 0.15s ease",
              ...VARIANT_STYLES[action.variant || "secondary"],
            }}
          >
            {action.loading ? (
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              action.icon
            )}
            {action.loading ? "Processing…" : action.label}
          </button>
        ))}

        {/* Clear selection */}
        <button
          onClick={onClear}
          title="Clear selection"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Convenience hook for managing bulk selections
export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggle = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(items.map((i) => i.id));
  }, [items]);

  const clear = React.useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  return {
    selectedIds,
    toggle,
    selectAll,
    clear,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}

export default BulkActionBar;
