"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Monitor, Clock, RefreshCw, Package, Bell, CheckCircle,
  Coffee, Truck, Maximize, Minimize, Volume2, VolumeX,
  Filter, ChevronRight, AlertTriangle, Zap, ArrowRight
} from "lucide-react";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import { SkeletonCard } from "./components/SkeletonLoader";
import { useSocket } from "@/context/SocketContext";
import { Tooltip } from "@/components/Tooltip";

interface KdsOrder {
  id: string;
  orderNumber: string;
  status: string;
  placedAt: string;
  acceptedAt: string | null;
  specialInstructions: string | null;
  customer: { name: string; phone: string };
  address: { label: string };
  orderItems: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: string;
    menuItem: { isSpicy: boolean; preparationTime: number } | null;
  }>;
}

const STATUS_META = {
  PENDING:   { label: "New Order",  color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <Bell size={14} />,        next: "ACCEPTED",   nextLabel: "Accept" },
  ACCEPTED:  { label: "Accepted",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <CheckCircle size={14} />, next: "PREPARING",  nextLabel: "Start Cooking" },
  PREPARING: { label: "Preparing",  color: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: <Coffee size={14} />,      next: "READY",      nextLabel: "Mark Ready" },
  READY:     { label: "Ready",      color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <Package size={14} />,     next: null,         nextLabel: null },
};

const FILTER_TABS = [
  { id: "ALL",       label: "All Active" },
  { id: "PENDING",   label: "New" },
  { id: "ACCEPTED",  label: "Accepted" },
  { id: "PREPARING", label: "Preparing" },
  { id: "READY",     label: "Ready" },
];

function minutesSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function ElapsedTimer({ startDate }: { startDate: string }) {
  const [elapsed, setElapsed] = useState(minutesSince(startDate));

  useEffect(() => {
    const iv = setInterval(() => setElapsed(minutesSince(startDate)), 10000);
    return () => clearInterval(iv);
  }, [startDate]);

  const isUrgent = elapsed > 15;
  const isWarning = elapsed > 10;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700,
      background: isUrgent ? "rgba(239,68,68,0.15)" : isWarning ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.12)",
      color: isUrgent ? "#ef4444" : isWarning ? "#d97706" : "#10b981",
      border: `1px solid ${isUrgent ? "rgba(239,68,68,0.3)" : isWarning ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
      animation: isUrgent ? "urgentPulse 1s ease-in-out infinite" : undefined,
    }}>
      <Clock size={11} /> {elapsed}m elapsed
    </span>
  );
}

function KdsCard({ order, onStatusChange, soundEnabled }: {
  order: KdsOrder;
  onStatusChange: (id: string, status: string) => Promise<void>;
  soundEnabled: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const meta = STATUS_META[order.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
  const waitMins = minutesSince(order.placedAt);
  const isUrgent = waitMins > 15;
  const totalItems = order.orderItems.reduce((s, i) => s + i.quantity, 0);

  const handleNext = async () => {
    if (!meta.next || updating) return;
    setUpdating(true);
    try {
      await onStatusChange(order.id, meta.next);
      if (soundEnabled && meta.next === "READY") {
        // Play success beep
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        } catch {}
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      border: `2px solid ${isUrgent ? "#ef4444" : meta.color}`,
      borderRadius: 16,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      position: "relative",
      boxShadow: isUrgent ? `0 0 20px rgba(239,68,68,0.25)` : "var(--shadow-sm)",
      transition: "box-shadow 0.3s ease",
    }}>
      {isUrgent && (
        <div style={{
          position: "absolute", top: -1, right: 16,
          background: "#ef4444", color: "#fff",
          fontSize: "0.65rem", fontWeight: 800, padding: "3px 10px",
          borderRadius: "0 0 8px 8px", letterSpacing: "0.5px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <AlertTriangle size={10} /> URGENT
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
            #{order.orderNumber}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
            {order.customer.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
            📍 {order.address.label}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            background: meta.bg, color: meta.color,
            padding: "5px 12px", borderRadius: 20,
            fontSize: "0.75rem", fontWeight: 700,
            border: `1px solid ${meta.color}40`,
          }}>
            {meta.icon} {meta.label}
          </span>
          <ElapsedTimer startDate={order.placedAt} />
        </div>
      </div>

      {/* Items */}
      <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, letterSpacing: "0.5px" }}>
          ORDER ITEMS ({totalItems} items)
        </div>
        {order.orderItems.map(item => (
          <div key={item.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0", borderBottom: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                background: meta.color + "20", color: meta.color,
                borderRadius: 6, padding: "2px 8px", fontSize: "0.85rem", fontWeight: 800,
              }}>
                ×{item.quantity}
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                {item.itemName}
                {item.menuItem?.isSpicy && " 🌶️"}
              </span>
            </div>
            {item.menuItem?.preparationTime && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                ~{item.menuItem.preparationTime}m
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div style={{
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", color: "#d97706",
        }}>
          📝 {order.specialInstructions}
        </div>
      )}

      {/* Action Button */}
      {meta.next && (
        <button
          onClick={handleNext}
          disabled={updating}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 20px", borderRadius: 10, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
            color: "#fff", fontWeight: 700, fontSize: "0.9rem",
            opacity: updating ? 0.7 : 1,
            transition: "all 0.2s",
            boxShadow: `0 4px 12px ${meta.color}40`,
          }}
        >
          {updating ? "Updating…" : <><ArrowRight size={16} /> {meta.nextLabel}</>}
        </button>
      )}
    </div>
  );
}

export default function AdminKDS() {
  const { data: rawKdsData, loading, refetch } = useAdminQuery<any>("/api/kds/orders", []);

  // Backend returns { pending, preparing, ready } — flatten into a single array
  const orders: KdsOrder[] = Array.isArray(rawKdsData)
    ? rawKdsData
    : [
        ...(Array.isArray(rawKdsData?.pending) ? rawKdsData.pending : []),
        ...(Array.isArray(rawKdsData?.preparing) ? rawKdsData.preparing : []),
        ...(Array.isArray(rawKdsData?.ready) ? rawKdsData.ready : []),
      ];
  const { socket } = useSocket();
  const [filter, setFilter] = useState("ALL");
  const [fullscreen, setFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-refresh every 20s
  useEffect(() => {
    const iv = setInterval(refetch, 20000);
    return () => clearInterval(iv);
  }, [refetch]);

  // Socket live updates
  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on("order:new", handler);
    socket.on("order:updated", handler);
    socket.on("kds:update", handler);
    return () => {
      socket.off("order:new", handler);
      socket.off("order:updated", handler);
      socket.off("kds:update", handler);
    };
  }, [socket, refetch]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Play new order sound
  const playNewOrderAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      [0, 100, 200].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.25);
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.25);
      });
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => playNewOrderAlert();
    socket.on("order:new", handler);
    return () => { socket.off("order:new", handler); };
  }, [socket, playNewOrderAlert]);


  const handleStatusChange = async (id: string, status: string) => {
    await adminFetch(`/api/kds/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    refetch();
  };

  const handleBatchPreparing = async () => {
    const accepted = orders.filter(o => o.status === "ACCEPTED");
    await Promise.allSettled(accepted.map(o => handleStatusChange(o.id, "PREPARING")));
  };

  const filtered = orders.filter(o =>
    filter === "ALL" ? ["PENDING","ACCEPTED","PREPARING","READY"].includes(o.status) : o.status === filter
  );

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div ref={wrapperRef} style={{
      display: "flex", flexDirection: "column", gap: 20,
      background: fullscreen ? "var(--bg-primary)" : undefined,
      padding: fullscreen ? 24 : undefined,
      minHeight: fullscreen ? "100vh" : undefined,
    }}>
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes kdsSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kds-card { animation: kdsSlideIn 0.25s ease-out; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor color="#6366f1" size={28} /> Kitchen Display System
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Live order tracking · Auto-refresh every 20s · {filtered.length} active orders
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tooltip content="Mark all Accepted orders as Preparing in one click" title="Batch: Start Cooking" shortcut="Alt+P">
            <button
              onClick={handleBatchPreparing}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
            >
              <Zap size={14} /> Start All Cooking
            </button>
          </Tooltip>

          <Tooltip content={soundEnabled ? "Disable audio alerts for new orders" : "Enable audio alerts for new orders"} title="Sound Alerts">
            <button
              onClick={() => setSoundEnabled(v => !v)}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: soundEnabled ? "#10b981" : "var(--text-secondary)" }}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {soundEnabled ? "Sound On" : "Sound Off"}
            </button>
          </Tooltip>

          <Tooltip content="Refresh orders now" title="Refresh" shortcut="Ctrl+R">
            <button onClick={refetch} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </Tooltip>

          <Tooltip content={fullscreen ? "Exit fullscreen mode" : "Enter fullscreen KDS mode for kitchen screens"} title="Fullscreen" shortcut="F11">
            <button onClick={toggleFullscreen} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
              {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              {fullscreen ? "Exit" : "Fullscreen"}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Status Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        {[
          { status: "PENDING",   label: "New",       color: "#ef4444" },
          { status: "ACCEPTED",  label: "Accepted",  color: "#f59e0b" },
          { status: "PREPARING", label: "Preparing", color: "#6366f1" },
          { status: "READY",     label: "Ready",     color: "#10b981" },
        ].map(s => (
          <div key={s.status} className="card" style={{ padding: "14px 16px", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1.1, marginTop: 4 }}>
              {counts[s.status] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontWeight: 700, fontSize: "0.82rem",
              border: "none", cursor: "pointer",
              background: filter === tab.id ? "rgba(99,102,241,0.15)" : "var(--bg-secondary)",
              color: filter === tab.id ? "#6366f1" : "var(--text-secondary)",
              borderBottom: filter === tab.id ? "2px solid #6366f1" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {tab.id !== "ALL" && counts[tab.id] ? (
              <span style={{
                marginLeft: 6, background: tab.id === "PENDING" ? "#ef4444" : "rgba(99,102,241,0.2)",
                color: tab.id === "PENDING" ? "#fff" : "#6366f1",
                borderRadius: 10, padding: "1px 6px", fontSize: "0.7rem",
              }}>
                {counts[tab.id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} h="320px" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <Monitor size={64} style={{ color: "var(--text-secondary)", margin: "0 auto 16px", opacity: 0.4 }} />
          <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No Active Orders</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {filter === "ALL" ? "All orders are complete. Waiting for new orders…" : `No orders with status "${filter}"`}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered
            .sort((a, b) => {
              const priority: Record<string, number> = { PENDING: 0, ACCEPTED: 1, PREPARING: 2, READY: 3 };
              return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
            })
            .map(order => (
              <div key={order.id} className="kds-card">
                <KdsCard order={order} onStatusChange={handleStatusChange} soundEnabled={soundEnabled} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
