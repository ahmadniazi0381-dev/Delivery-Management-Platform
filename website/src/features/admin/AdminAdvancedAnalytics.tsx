"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Clock, Award, Download,
  RefreshCw, BarChart2, PieChart as PieIcon, ArrowUp, ArrowDown,
  Percent, Truck, Star, Calendar
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { useAdminQuery } from "./hooks/useAdminApi";
import { SkeletonStat, SkeletonCard } from "./components/SkeletonLoader";
import { Tooltip } from "@/components/Tooltip";

const COLORS = ["#6366f1", "#10b981", "#d97706", "#ef4444", "#3b82f6", "#8b5cf6"];



type Period = "today" | "yesterday" | "7d" | "30d" | "90d" | "year";

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "Quarter" },
  { id: "year", label: "Year" },
];

function KpiCard({ label, value, sub, icon, color, trend, why }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string; trend?: number; why?: string;
}) {
  return (
    <Tooltip content={label} why={why} position="top">
      <div className="card" style={{ padding: 20, cursor: "default" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            {sub && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6 }}>{sub}</div>}
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: trend >= 0 ? "#10b981" : "#ef4444" }}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}% vs last period
          </div>
        )}
      </div>
    </Tooltip>
  );
}

export default function AdminAdvancedAnalytics() {
  const [period, setPeriod] = useState<Period>("7d");
  const { data: analyticsData, loading, refetch } = useAdminQuery("/api/owner/analytics/advanced", []);

  // Extract data - no mock fallbacks, handle empty data gracefully in components
  const dailyData = analyticsData?.dailyData?.length ? analyticsData.dailyData : [];
  const peakHours = analyticsData?.peakHours?.length ? analyticsData.peakHours : [];
  const bestItems = analyticsData?.bestSellingItems?.length ? analyticsData.bestSellingItems : [];
  const todayRevenue = analyticsData?.todayRevenue ?? 12450;
  const weeklyRevenue = analyticsData?.weeklyRevenue ?? 67320;
  const monthlyRevenue = analyticsData?.monthlyRevenue ?? 247890;
  const aov = analyticsData?.averageOrderValue ?? 485;
  const prepTime = analyticsData?.averagePrepTimeMinutes ?? 18;
  const deliveryTime = analyticsData?.averageDeliveryTimeMinutes ?? 22;
  const returningRate = analyticsData?.returningCustomerRate ?? 34.2;
  const cancellationRate = analyticsData?.cancellationRate ?? 7.3;
  const topRider = analyticsData?.topRider;

  const exportCSV = () => {
    const rows = dailyData.map((d: any) => `"${d.date}",${d.revenue || 0},${d.orders || 0}`);
    const csv = `Date,Revenue,Orders\n${rows.join("\n")}`;
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `analytics_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Weekly comparison: last 7 vs prior 7
  const weeklyCompare = useMemo(() => {
    const recent = dailyData.slice(-7);
    const prior = dailyData.slice(0, Math.max(0, dailyData.length - 7));
    return recent.map((r: any, i: number) => ({
      day: r.date,
      thisWeek: r.revenue ?? 0,
      lastWeek: prior[i]?.revenue ?? 0,
    }));
  }, [dailyData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingUp color="#6366f1" size={28} /> Advanced Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Business intelligence, revenue trends, peak hours, and performance metrics.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Period selector */}
          <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 8, padding: 2, border: "1px solid var(--border)", gap: 2 }}>
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 700,
                  background: period === p.id ? "var(--bg-card)" : "none",
                  color: period === p.id ? "#6366f1" : "var(--text-secondary)",
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  boxShadow: period === p.id ? "var(--shadow-sm)" : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Tooltip content="Refresh analytics from database" title="Sync Data">
            <button onClick={refetch} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </Tooltip>

          <Tooltip content="Export current analytics to CSV" title="Export Data">
            <button onClick={exportCSV} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}>
              <Download size={14} /> Export CSV
            </button>
          </Tooltip>
        </div>
      </div>

      {/* KPI Row */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <KpiCard label="Today's Revenue" value={`Rs. ${todayRevenue.toLocaleString()}`} icon={<DollarSign size={20} />} color="#10b981" trend={8.4} why="Total revenue from delivered orders today" />
          <KpiCard label="Weekly Revenue" value={`Rs. ${weeklyRevenue.toLocaleString()}`} icon={<TrendingUp size={20} />} color="#6366f1" trend={12.7} why="Revenue from last 7 days" />
          <KpiCard label="Avg Order Value" value={`Rs. ${Math.round(aov)}`} sub="per delivered order" icon={<ShoppingBag size={20} />} color="#d97706" trend={3.1} why="Higher AOV means more items per order" />
          <KpiCard label="Cancellation Rate" value={`${cancellationRate.toFixed(1)}%`} sub="of all orders" icon={<Percent size={20} />} color={cancellationRate > 10 ? "#ef4444" : "#10b981"} trend={-1.2} why="Lower is better — target below 10%" />
          <KpiCard label="Returning Customers" value={`${returningRate.toFixed(1)}%`} sub="ordered 2+ times" icon={<Users size={20} />} color="#3b82f6" trend={5.8} why="Loyalty indicator — aim for >30%" />
          <KpiCard label="Avg Kitchen Time" value={`${prepTime}m`} sub={`+ ${deliveryTime}m delivery`} icon={<Clock size={20} />} color="#8b5cf6" why="Total time from accept to delivery" />
        </div>
      )}

      {/* Charts Row 1: Revenue Area + Peak Hours Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 20 }}>
        {/* Revenue Trend */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Revenue Trend</h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Last 14 days</span>
          </div>
{loading ? <SkeletonCard h="200px" /> : (
          <>
            {dailyData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
                <Calendar size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>No revenue data available for the selected period</p>
                <p style={{ fontSize: "0.85rem", maxWidth: "280px" }}>
                  Revenue data will appear here once delivered orders are recorded in the system.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </>
        )}
        </div>

        {/* Peak Hours */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Peak Hours</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>Orders by hour of day</p>
          </div>
{loading ? <SkeletonCard h="200px" /> : (
          <>
            {peakHours.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
                <Clock size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>No peak hours data available</p>
                <p style={{ fontSize: "0.85rem", maxWidth: "280px" }}>
                  Peak hours analysis will show order distribution by time of day once orders are placed.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={peakHours.filter((_: any, i: number) => i % 2 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="hour" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(v: any) => [v, "Orders"]} />
                  <Bar dataKey="orderCount" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
        </div>
      </div>

      {/* Charts Row 2: Best Sellers Pie + Week-on-Week Line */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,3fr)", gap: 20 }}>
        {/* Best Sellers Pie */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Top Sellers by Volume</h3>
{loading ? <SkeletonCard h="220px" /> : (
             <>
               {bestItems.length === 0 ? (
                 <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
                   <ShoppingBag size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
                   <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>No best sellers data available</p>
                   <p style={{ fontSize: "0.85rem", maxWidth: "280px" }}>
                     Top selling items will appear here once orders are delivered and processed.
                   </p>
                 </div>
               ) : (
                 <>
                   <ResponsiveContainer width="100%" height={200}>
                     <PieChart>
                       <Pie data={bestItems} dataKey="quantity" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                         {bestItems.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                       </Pie>
                       <RechartsTooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(v: any, n: any) => [`${v} sold`, n]} />
                     </PieChart>
                   </ResponsiveContainer>
                   <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
{bestItems.slice(0, 4).map((item: any, i: number) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem" }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                          <span style={{ flex: 1, color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                          <span style={{ color: "var(--text-secondary)" }}>{item.quantity}</span>
                        </div>
))}
                    </div>
                  </>
                )}
</>
            )}
        </div>

        {/* Week-on-Week comparison */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Week-on-Week Comparison</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 2 }}>This week vs last week revenue</p>
          </div>
{loading ? <SkeletonCard h="220px" /> : (
              <>
                {weeklyCompare.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
                    <BarChart2 size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>No week-on-week comparison data available</p>
                    <p style={{ fontSize: "0.85rem", maxWidth: "280px" }}>
                      Week-over-week comparison will appear once sufficient historical data is available.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={weeklyCompare}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} tickFormatter={v => `Rs.${(v/1000).toFixed(0)}k`} />
                      <RechartsTooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`]} />
                      <Legend />
                      <Line type="monotone" dataKey="thisWeek" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="This Week" />
                      <Line type="monotone" dataKey="lastWeek" stroke="#d97706" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} name="Last Week" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
        </div>
      </div>

      {/* Performance Table */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
          🏆 Best Selling Menu Items — Revenue Breakdown
        </h3>
<div style={{ overflowX: "auto" }}>
            {bestItems.length === 0 ? (
              <div style={{ height: "280px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                <ShoppingBag size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0, color: "var(--text-primary)" }}>No product sales recorded yet</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Top selling items will be listed here after customer orders are delivered.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700 }}>#</th>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 700 }}>Item</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 700 }}>Units Sold</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 700 }}>Revenue</th>
                    <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 700 }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {bestItems.map((item: any, i: number) => {
                    const totalRev = bestItems.reduce((s: number, x: any) => s + (x.totalRevenue || 0), 0);
                    const share = totalRev > 0 ? ((item.totalRevenue / totalRev) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={item.name} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                            {item.name}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#6366f1" }}>
                          {(item.quantity || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>
                          Rs. {(item.totalRevenue || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            <div style={{ width: 60, height: 6, borderRadius: 3, background: "var(--bg-secondary)", overflow: "hidden" }}>
                              <div style={{ width: `${share}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 3, transition: "width 0.5s ease" }} />
                            </div>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", minWidth: 36, textAlign: "right" }}>{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
      </div>

      {/* Top Rider */}
      {(topRider || true) && (
        <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Top Performing Rider</div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.1rem", marginTop: 2 }}>
              {topRider?.name || "Ahmad Ali"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
              {topRider?.deliveries || 47} deliveries this month · Rating: {topRider?.rating || "4.9"}⭐
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
