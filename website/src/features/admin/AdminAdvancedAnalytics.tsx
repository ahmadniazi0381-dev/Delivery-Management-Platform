"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users,
  Clock, Star, Truck, AlertTriangle, RefreshCw, Award, BarChart2,
  Zap, ChevronRight, Package
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { useAdminQuery } from "./hooks/useAdminApi";
import { SkeletonStat, SkeletonCard } from "./components/SkeletonLoader";

interface AdvancedAnalytics {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  bestSellingItems: Array<{ id: string; name: string; quantity: number; totalRevenue: number }>;
  worstSellingItems: Array<{ id: string; name: string; quantity: number; totalRevenue: number }>;
  peakHours: Array<{ hour: string; orderCount: number }>;
  averagePrepTimeMinutes: number;
  averageDeliveryTimeMinutes: number;
  returningCustomerRate: number;
  cancelledOrdersCount: number;
  cancellationRate: number;
  topRider: { name: string; phone: string; deliveredCount: number } | null;
  topManager: { name: string; role: string; actionsCount: number } | null;
}

const PIE_COLORS = ["#d97706", "#6366f1", "#10b981", "#ec4899", "#3b82f6", "#f59e0b"];

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string; trend?: "up" | "down" | null }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
          <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "6px 0 0", color: "var(--text-primary)" }}>{value}</h3>
          {sub && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>{sub}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: trend === "up" ? "#10b981" : "#ef4444" }}>
          {trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend === "up" ? "Performing well" : "Needs attention"}
        </div>
      )}
    </div>
  );
}

export default function AdminAdvancedAnalytics() {
  const { data, loading, refetch } = useAdminQuery<AdvancedAnalytics>("/api/owner/analytics/advanced", []);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[1,2,3,4,5,6].map(i => <SkeletonStat key={i} />)}
      </div>
      <SkeletonCard h="300px" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SkeletonCard h="280px" />
        <SkeletonCard h="280px" />
      </div>
    </div>
  );

  const a = data;
  if (!a) return null;

  const peakHoursChartData = a.peakHours.filter(h => h.orderCount > 0).map(h => ({
    hour: h.hour.substring(0, 5),
    orders: h.orderCount,
  }));

  const topItemsChartData = a.bestSellingItems.map(item => ({
    name: item.name.length > 18 ? item.name.substring(0, 18) + "…" : item.name,
    qty: item.quantity,
    revenue: item.totalRevenue,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Advanced Analytics</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Deep insights into revenue, performance, and customer behaviour.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Revenue Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard label="Today's Revenue" value={`Rs. ${a.todayRevenue.toLocaleString()}`} icon={<DollarSign size={20} />} color="#10b981" />
        <StatCard label="Weekly Revenue" value={`Rs. ${a.weeklyRevenue.toLocaleString()}`} icon={<TrendingUp size={20} />} color="#6366f1" />
        <StatCard label="Monthly Revenue" value={`Rs. ${a.monthlyRevenue.toLocaleString()}`} icon={<BarChart2 size={20} />} color="#d97706" />
        <StatCard label="Avg. Order Value" value={`Rs. ${a.averageOrderValue.toLocaleString()}`} icon={<ShoppingBag size={20} />} color="#ec4899" />
        <StatCard label="Avg. Prep Time" value={`${a.averagePrepTimeMinutes} min`} icon={<Clock size={20} />} color="#3b82f6" />
        <StatCard label="Avg. Delivery Time" value={`${a.averageDeliveryTimeMinutes} min`} icon={<Truck size={20} />} color="#8b5cf6" />
      </div>

      {/* Customer & Cancellation */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard
          label="Returning Customers"
          value={`${a.returningCustomerRate}%`}
          sub="Customers who ordered more than once"
          icon={<Users size={20} />}
          color="#10b981"
          trend={a.returningCustomerRate > 30 ? "up" : "down"}
        />
        <StatCard
          label="Cancelled Orders"
          value={`${a.cancelledOrdersCount}`}
          sub={`${a.cancellationRate}% cancellation rate`}
          icon={<AlertTriangle size={20} />}
          color="#ef4444"
          trend={a.cancellationRate < 10 ? "up" : "down"}
        />
        {a.topRider && (
          <div className="card" style={{ padding: 20, borderLeft: "3px solid #10b981" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: 8 }}>🏆 Top Rider</div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{a.topRider.name}</div>
            <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600, marginTop: 4 }}>
              {a.topRider.deliveredCount} deliveries completed
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{a.topRider.phone}</div>
          </div>
        )}
        {a.topManager && (
          <div className="card" style={{ padding: 20, borderLeft: "3px solid #6366f1" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: 8 }}>⭐ Top Manager</div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{a.topManager.name}</div>
            <div style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, marginTop: 4 }}>
              {a.topManager.actionsCount} actions taken
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{a.topManager.role}</div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Peak Hours */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 18, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} color="#d97706" /> Peak Order Hours
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={peakHoursChartData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={10} />
              <YAxis stroke="var(--text-secondary)" fontSize={10} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)", fontSize: "0.82rem" }} />
              <Bar dataKey="orders" name="Orders" fill="var(--saffron)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Sellers */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 18, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={16} color="#10b981" /> Best Selling Items
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topItemsChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={10} />
              <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={10} width={100} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)", fontSize: "0.82rem" }} />
              <Bar dataKey="qty" name="Units Sold" fill="#6366f1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worst Sellers */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingDown size={16} color="#ef4444" /> Worst Performing Items
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 16 }}>Consider removing from menu or running a promotion.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {a.worstSellingItems.map((item, i) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(239,68,68,0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>{i+1}</span>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{item.name}</span>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: "0.82rem" }}>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>{item.quantity} sold</span>
                <span style={{ color: "var(--text-secondary)" }}>Rs. {item.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
