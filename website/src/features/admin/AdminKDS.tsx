"use client";

import React, { useState } from "react";
import {
  Monitor, Clock, RefreshCw, Package, BarChart2, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, XCircle, Coffee, Truck, Bell
} from "lucide-react";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import { SkeletonCard } from "./components/SkeletonLoader";

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
  PENDING: { label: "New", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: <Bell size={14} /> },
  ACCEPTED: { label: "Accepted", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <CheckCircle size={14} /> },
  PREPARING: { label: "Preparing", color: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: <Coffee size={14} /> },
  READY: { label: "Ready", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <Package size={14} /> },
};

function minutesSince(date: string | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

function KdsCard({ order, onStatusChange }: { order: KdsOrder; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);
  const meta = STATUS_META[order.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
  const waitMins = minutesSince(order.placedAt);
  const isUrgent = waitMins > 20;

  const handleStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusChange(order.id, newStatus);
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
      gap: 12,
      animation: "kds-card-in 0.3s ease-out",
      position: "relative",
    }}>
      {isUrgent && (
        <div style={{
          position: "absolute", top: -1, right: 12,
          background: "#ef4444", color: "#fff",
          fontSize: "0.65rem", fontWeight: 800, padding: "3px 10px",
          borderRadius: "0 0 8px 8px", letterSpacing: "0.5px",
        }}>
          ⚠ URGENT
        </div>
      )}

      {/* Order Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text-primary)" }}>
            #{order.orderNumber}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
            {order.customer.name} · {order.address.label}
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: meta.bg, color: meta.color,
          padding: "4px 12px", borderRadius: 20,
          fontSize: "0.75rem", fontWeight: 700,
        }}>
          {meta.icon} {meta.label}
        </div>
      </div>

      {/* Items */}
      <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: 12 }}>
        {order.orderItems.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: "var(--saffron)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.85rem",
              }}>{item.quantity}</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {item.itemName}
                {item.menuItem?.isSpicy && <span style={{ color: "#ef4444", marginLeft: 6 }}>🌶</span>}
              </span>
            </div>
            {item.menuItem?.preparationTime && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>~{item.menuItem.preparationTime}m</span>
            )}
          </div>
        ))}
      </div>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem", color: "#d97706" }}>
          <strong>📝 Customer Note:</strong> {order.specialInstructions}
        </div>
      )}

      {/* Timer & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: isUrgent ? "#ef4444" : "var(--text-secondary)", fontWeight: isUrgent ? 700 : 400 }}>
          <Clock size={13} /> {waitMins} min waiting
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(order.status === "PENDING" || order.status === "ACCEPTED") && (
            <button onClick={() => handleStatus("PREPARING")} disabled={updating}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer" }}>
              {updating ? "…" : "Start Prep"}
            </button>
          )}
          {order.status === "PREPARING" && (
            <button onClick={() => handleStatus("READY")} disabled={updating}
              style={{ padding: "7px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer" }}>
              {updating ? "…" : "Mark Ready"}
            </button>
          )}
          {order.status === "READY" && (
            <div style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Truck size={14} /> Waiting for rider
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminKDS() {
  const { data, loading, refetch } = useAdminQuery<{
    pending: KdsOrder[];
    preparing: KdsOrder[];
    ready: KdsOrder[];
    totalActive: number;
  }>("/api/kds/orders", []);

  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      await adminFetch(`/api/kds/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      refetch();
    } catch (err: any) {
      console.error("KDS status update failed:", err);
    } finally {
      setUpdating(false);
    }
  };

  const pending = data?.pending || [];
  const preparing = data?.preparing || [];
  const ready = data?.ready || [];
  const totalActive = data?.totalActive || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        @keyframes kds-card-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(236,72,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ec4899" }}>
            <Monitor size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Kitchen Display</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{totalActive} active orders</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Columns */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} h="260px" />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {/* Pending / Accepted Column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Bell size={16} color="#ef4444" />
              <span style={{ fontWeight: 800, color: "#ef4444", fontSize: "0.9rem" }}>NEW ORDERS</span>
              <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>{pending.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pending.map(order => (
                <KdsCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
              {pending.length === 0 && (
                <div style={{ padding: 28, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", border: "2px dashed var(--border)", borderRadius: 12 }}>
                  No new orders
                </div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Coffee size={16} color="#6366f1" />
              <span style={{ fontWeight: 800, color: "#6366f1", fontSize: "0.9rem" }}>PREPARING</span>
              <span style={{ marginLeft: "auto", background: "#6366f1", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>{preparing.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {preparing.map(order => (
                <KdsCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
              {preparing.length === 0 && (
                <div style={{ padding: 28, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", border: "2px dashed var(--border)", borderRadius: 12 }}>
                  No orders preparing
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <CheckCircle size={16} color="#10b981" />
              <span style={{ fontWeight: 800, color: "#10b981", fontSize: "0.9rem" }}>READY FOR PICKUP</span>
              <span style={{ marginLeft: "auto", background: "#10b981", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>{ready.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ready.map(order => (
                <KdsCard key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
              {ready.length === 0 && (
                <div style={{ padding: 28, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", border: "2px dashed var(--border)", borderRadius: 12 }}>
                  No orders ready
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
