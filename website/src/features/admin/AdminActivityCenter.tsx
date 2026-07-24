"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity, Clock, Filter, RefreshCw, ChevronLeft, ChevronRight,
  ShoppingBag, Utensils, Package, User, LogIn, Printer, AlertCircle
} from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { useAdminQuery } from "./hooks/useAdminApi";
import { SkeletonCard } from "./components/SkeletonLoader";

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
    staffProfile: { staffRole: string } | null;
  };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  ACCEPT_ORDER: <ShoppingBag size={14} />,
  REJECT_ORDER: <ShoppingBag size={14} />,
  MENU: <Utensils size={14} />,
  STOCK: <Package size={14} />,
  LOGIN: <LogIn size={14} />,
  PRINT: <Printer size={14} />,
};

function getActionIcon(action: string) {
  for (const key of Object.keys(ACTION_ICONS)) {
    if (action.includes(key)) return ACTION_ICONS[key];
  }
  return <Activity size={14} />;
}

const ACTION_COLORS: Record<string, string> = {
  ACCEPT: "#10b981",
  REJECT: "#ef4444",
  CANCEL: "#ef4444",
  MENU: "#6366f1",
  STOCK: "#d97706",
  LOGIN: "#3b82f6",
  PRINT: "#8b5cf6",
  OVERRIDE: "#f59e0b",
  KDS: "#ec4899",
};

function getActionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return "var(--text-secondary)";
}

function humanizeAction(action: string, details: string | null): string {
  const actionMap: Record<string, string> = {
    ACCEPT_ORDER: "accepted an order",
    REJECT_ORDER: "rejected an order",
    KDS_PREPARING: "moved order to Preparing",
    KDS_READY: "marked order as Ready",
    KDS_UPDATE_READY: "marked order as Ready",
    KDS_UPDATE_PREPARING: "moved order to Preparing",
    UPDATE_MENU_ITEM: "updated a menu item",
    CREATE_MENU_ITEM: "created a menu item",
    DELETE_MENU_ITEM: "deleted a menu item",
    UPDATE_STOCK: "updated stock",
    OWNER_OVERRIDE: "applied owner override",
    UPDATE_INTERNAL_NOTES: "updated internal notes",
    PRINT_RECEIPT: "printed a receipt",
  };

  const base = actionMap[action] || action.toLowerCase().replace(/_/g, " ");
  if (details) {
    const match = details.match(/Order #(\d+)/);
    if (match) return `${base} — Order #${match[1]}`;
  }
  return base;
}

function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminActivityCenter() {
  const [page, setPage] = useState(1);
  const [liveFlash, setLiveFlash] = useState(false);
  const { socket } = useSocket();

  const { data, loading, refetch } = useAdminQuery<{
    activities: ActivityEntry[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/owner/activity?page=${page}&limit=20`, [page]);

  const handleRefresh = useCallback(() => {
    setLiveFlash(true);
    setTimeout(() => setLiveFlash(false), 600);
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!socket) return;
    socket.on("order:updated", handleRefresh);
    socket.on("order:new", handleRefresh);
    socket.on("staff:action", handleRefresh);
    return () => {
      socket.off("order:updated", handleRefresh);
      socket.off("order:new", handleRefresh);
      socket.off("staff:action", handleRefresh);
    };
  }, [socket, handleRefresh]);

  const activities = data?.activities || [];
  const pagination = data?.pagination;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes activity-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .activity-row { animation: activity-in 0.25s ease-out; }
        @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .live-badge { display: flex; align-items: center; gap: 6px; }
        .live-badge.flash .live-dot { animation: live-pulse 0.4s ease-in-out; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Activity Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Chronological log of all staff actions across the platform.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className={`live-badge ${liveFlash ? "flash" : ""}`} style={{ fontSize: "0.78rem", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            LIVE
          </span>
          <button onClick={handleRefresh} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} h="56px" />)}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Activity size={40} style={{ color: "var(--text-secondary)", marginBottom: 12 }} />
            <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>No activity yet</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 6 }}>Staff actions will appear here in real-time.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 0, padding: "12px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <span>Staff Member</span>
              <span>Action</span>
              <span>Role</span>
              <span>Time</span>
            </div>

            {activities.map((entry, idx) => {
              const color = getActionColor(entry.action);
              const icon = getActionIcon(entry.action);
              const text = humanizeAction(entry.action, entry.details);
              const role = entry.user.staffProfile?.staffRole || entry.user.role;

              return (
                <div
                  key={entry.id}
                  className="activity-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 2fr 1fr 1fr",
                    gap: 0,
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border)",
                    alignItems: "center",
                    background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Staff */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `${color}20`,
                      color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.85rem", flexShrink: 0,
                    }}>
                      {entry.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {entry.user.name}
                    </span>
                  </div>

                  {/* Action */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{text}</span>
                  </div>

                  {/* Role */}
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, color,
                    background: `${color}15`, border: `1px solid ${color}30`,
                    padding: "2px 10px", borderRadius: 20, width: "fit-content",
                  }}>
                    {role.replace("_", " ")}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {formatRelativeTime(entry.createdAt)}
                    <span style={{ display: "block", fontSize: "0.7rem", marginTop: 2 }}>
                      {new Date(entry.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span style={{ padding: "6px 14px", background: "var(--bg-secondary)", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                    {page} / {pagination.totalPages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                    className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
