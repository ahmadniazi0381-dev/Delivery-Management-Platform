"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useSocket } from "@/context/SocketContext";

const MOCK_ANALYTICS = {
  revenue: 42500,
  totalCustomers: 180,
  orderCounts: {
    PENDING: 3,
    ACCEPTED: 2,
    PREPARING: 4,
    READY: 1,
    OUT_FOR_DELIVERY: 2,
    DELIVERED: 124,
    CANCELLED: 8,
    REJECTED: 3,
  },
  topSellingItems: [
    { name: 'Naseeb Special Biryani', quantity: 82 },
    { name: 'Sada Pulao (Double)', quantity: 45 },
    { name: 'Saffron Pulao', quantity: 38 },
    { name: 'Chicken Karahi', quantity: 24 },
    { name: 'Raita & Salad Cup', quantity: 95 }
  ]
};

const REVENUE_DATA = [
  { day: 'Mon', sales: 24000 },
  { day: 'Tue', sales: 28000 },
  { day: 'Wed', sales: 32000 },
  { day: 'Thu', sales: 27000 },
  { day: 'Fri', sales: 45000 },
  { day: 'Sat', sales: 55000 },
  { day: 'Sun', sales: 42500 }
];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const { socket } = useSocket();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("naseeb_token");
    if (!token || token === "sandbox_demo_token") {
      setIsOffline(true);
      setAnalytics(MOCK_ANALYTICS);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAnalytics({
            revenue: data.data.totalRevenue || 0,
            totalCustomers: data.data.totalCustomers || 0,
            orderCounts: data.data.orderCounts || MOCK_ANALYTICS.orderCounts,
            topSellingItems: data.data.topSellingItems || MOCK_ANALYTICS.topSellingItems
          });
          setIsOffline(false);
        } else if (data.revenue !== undefined) {
          // Direct format from getOwnerAnalytics
          setAnalytics({
            revenue: data.revenue || 0,
            totalCustomers: data.totalCustomers || 0,
            orderCounts: data.orderCounts || MOCK_ANALYTICS.orderCounts,
            topSellingItems: data.topSellingItems || MOCK_ANALYTICS.topSellingItems
          });
          setIsOffline(false);
        }
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Live updates via Socket.IO (REQ-ORDER-ALERT-001 dashboard update) ────
  useEffect(() => {
    if (!socket) return;

    const triggerRefresh = () => {
      // Flash the "live" indicator
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 800);
      fetchAnalytics();
    };

    socket.on("order:new",       triggerRefresh);
    socket.on("order:updated",   triggerRefresh);
    socket.on("order:accepted",  triggerRefresh);
    socket.on("order:rejected",  triggerRefresh);
    socket.on("order:cancelled", triggerRefresh);
    socket.on("payment:success", triggerRefresh);

    return () => {
      socket.off("order:new",       triggerRefresh);
      socket.off("order:updated",   triggerRefresh);
      socket.off("order:accepted",  triggerRefresh);
      socket.off("order:rejected",  triggerRefresh);
      socket.off("order:cancelled", triggerRefresh);
      socket.off("payment:success", triggerRefresh);
    };
  }, [socket, fetchAnalytics]);

  const totalOrders = Object.values(analytics.orderCounts)
    .reduce((a: number, b: unknown) => a + (b as number), 0) as number;

  const activeOrders =
    (analytics.orderCounts.PENDING || 0) +
    (analytics.orderCounts.ACCEPTED || 0) +
    (analytics.orderCounts.PREPARING || 0) +
    (analytics.orderCounts.READY || 0) +
    (analytics.orderCounts.OUT_FOR_DELIVERY || 0);

  const pendingOrders = analytics.orderCounts.PENDING || 0;
  const hasPending = pendingOrders > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="fade-in">
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse-card {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
        @keyframes live-flash {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .spin { animation: spin 1s linear infinite; }
        .pulse-card { animation: pulse-card 1.2s ease-in-out infinite; }
        .live-flash { animation: live-flash 0.4s ease-in-out; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Dashboard Overview
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Real-time analytics and store performance logs.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Live indicator */}
          <span
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "0.8rem", color: "#10b981",
              background: "rgba(16,185,129,0.1)",
              padding: "4px 10px", borderRadius: "20px", fontWeight: 600,
            }}
            className={liveFlash ? "live-flash" : ""}
          >
            <Zap size={12} /> LIVE
          </span>

          {isOffline && (
            <span style={{ fontSize: "0.8rem", color: "var(--saffron)", background: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>
              ⚠️ Sandbox Mode
            </span>
          )}
          <button
            onClick={fetchAnalytics}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "0.85rem" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        {/* Total Revenue */}
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Revenue</span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>
              Rs. {analytics.revenue.toLocaleString()}
            </h3>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Orders</span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>
              {totalOrders}
            </h3>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(217,119,6,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--saffron)" }}>
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Pending Orders — pulses when there are pending orders */}
        <div
          className={`card${hasPending ? " pulse-card" : ""}`}
          style={{
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: hasPending ? "2px solid rgba(239,68,68,0.5)" : undefined,
            transition: "border 0.3s ease",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: hasPending ? "#ef4444" : "var(--text-secondary)", fontWeight: 600 }}>
              {hasPending ? "🔴 Pending Orders" : "Pending Orders"}
            </span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: hasPending ? "#ef4444" : "var(--text-primary)" }}>
              {pendingOrders}
            </h3>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: hasPending ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: hasPending ? "#ef4444" : "rgb(139,92,246)" }}>
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Total Customers */}
        <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Customers</span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>
              {analytics.totalCustomers}
            </h3>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(59,130,246)" }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Top Sellers */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }} className="profile-layout">
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Revenue Trend (Weekly)</h3>
          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                <Line type="monotone" dataKey="sales" stroke="var(--saffron)" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Top Selling Dishes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {analytics.topSellingItems.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, width: "24px", height: "24px", borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--saffron)" }}>{item.quantity} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Status Bento */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Order Funnel Statuses</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "15px" }}>
          {Object.entries(analytics.orderCounts).map(([status, count]: any) => {
            const isPending = status === "PENDING" && count > 0;
            return (
              <div
                key={status}
                className={isPending ? "pulse-card" : ""}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: isPending ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--border)",
                  background: isPending ? "rgba(239,68,68,0.05)" : "var(--bg-secondary)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: isPending ? "#ef4444" : "var(--text-secondary)", textTransform: "uppercase" }}>
                  {status.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "8px", color: isPending ? "#ef4444" : "var(--text-primary)" }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
