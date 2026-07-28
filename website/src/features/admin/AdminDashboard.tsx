"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSocket } from "@/context/SocketContext";
import { useAdminQuery } from "./hooks/useAdminApi";
import { SkeletonStat, SkeletonCard } from "./components/SkeletonLoader";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [liveFlash, setLiveFlash] = useState(false);
  const { socket } = useSocket();

  // Queries
  const { data: analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useAdminQuery(`/owner/analytics`, []);
  const { data: revenueData, loading: revenueLoading, refetch: refetchRevenue } = useAdminQuery(`/owner/analytics/revenue?period=${period}`, [period]);

  const fetchAll = useCallback(() => {
    refetchAnalytics();
    refetchRevenue();
  }, [refetchAnalytics, refetchRevenue]);

  // Live updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const triggerRefresh = () => {
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 800);
      fetchAll();
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
  }, [socket, fetchAll]);

  // Derived stats
  const totalRevenue = revenueData?.totalRevenue ?? analytics?.revenue ?? 0;
  const totalOrders = revenueData?.totalOrders ?? 0;
  const pendingOrders = analytics?.orderCounts?.PENDING ?? 0;
  const hasPending = pendingOrders > 0;
  const totalCustomers = analytics?.totalCustomers ?? 0;
  const avgOrderValue = revenueData?.avgOrderValue ?? 0;

  const dailyData = revenueData?.dailyData ?? [];
  const topSellingItems = analytics?.topSellingItems ?? [];
  const orderCounts = analytics?.orderCounts ?? {
    PENDING: 0,
    ACCEPTED: 0,
    PREPARING: 0,
    READY: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };

  const displayDailyData = useMemo(() => {
    if (dailyData.length > 0) return dailyData;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toISOString().slice(0, 10),
        revenue: 0,
        orders: 0,
      };
    });
  }, [dailyData]);

  const isRevenueEmpty = dailyData.length === 0 || dailyData.every((d: any) => !d.revenue);

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
            Real-time shop status, pending logs and operations overview.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "0.8rem", color: "#10b981",
              background: "rgba(16,185,129,0.1)",
              padding: "4px 10px", borderRadius: "20px", fontWeight: 600,
            }}
            className={liveFlash ? "live-flash" : ""}
          >
            <Zap size={12} /> LIVE SYNCED
          </span>
          <button
            onClick={fetchAll}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "0.85rem" }}
          >
            <RefreshCw size={14} className={analyticsLoading || revenueLoading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
        {analyticsLoading || revenueLoading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Period Revenue</span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>
                  Rs. {totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                <DollarSign size={24} />
              </div>
            </div>

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

            <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Total Customers</span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>
                  {totalCustomers}
                </h3>
              </div>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(59,130,246)" }}>
                <Users size={24} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts & Top Sellers */}
      <div className="admin-dashboard-grid">
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Revenue Trend</h3>
              {isRevenueEmpty && (
                <span style={{ fontSize: "0.72rem", background: "var(--bg-secondary)", padding: "2px 8px", borderRadius: "10px", color: "var(--text-secondary)" }}>
                  Zero data curve
                </span>
              )}
            </div>
            <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: "8px", padding: "2px", border: "1px solid var(--border)" }}>
              {(['7d', '30d'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                    background: period === p ? "var(--bg-card)" : "none",
                    color: period === p ? "var(--saffron)" : "var(--text-secondary)",
                    border: "none", cursor: "pointer"
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {revenueLoading ? <SkeletonCard h="300px" /> : (
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayDailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--saffron)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--saffron)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(t) => t.substring(5)} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                  <Area type="monotone" dataKey="revenue" name="Sales (Rs.)" stroke="var(--saffron)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Top Selling Dishes</h3>
          {analyticsLoading ? <SkeletonCard h="300px" /> : topSellingItems.length === 0 ? (
            <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-secondary)" }}>
              <ShoppingBag size={40} style={{ opacity: 0.2 }} />
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>No Sales Data Yet</p>
              <p style={{ fontSize: "0.8rem", textAlign: "center" }}>Top-selling items appear here once orders are delivered.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {topSellingItems.slice(0, 5).map((item: any, i: number) => (
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
          )}
        </div>
      </div>

      {/* Order Status Funnel Bento */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Order Funnel Statuses</h3>
        {analyticsLoading ? <SkeletonCard h="120px" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "15px" }}>
            {Object.entries(orderCounts).map(([status, count]: any) => {
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
        )}
      </div>
    </div>
  );
}
