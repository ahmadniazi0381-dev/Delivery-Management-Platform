"use client";
import React, { useState, useMemo } from 'react';
import { useAdminQuery } from './hooks/useAdminApi';
import { SkeletonCard } from './components/SkeletonLoader';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

const COLORS = ['#D97706', '#7C2D12', '#15803D', '#2563EB', '#7C3AED'];

const HOURS_LABEL = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));

function getHeatmapColor(count: number) {
  if (count === 0) return 'var(--bg-secondary)';
  if (count <= 2) return 'rgba(217, 119, 6, 0.15)';
  if (count <= 6) return 'rgba(217, 119, 6, 0.4)';
  if (count <= 14) return 'rgba(217, 119, 6, 0.75)';
  return 'var(--saffron)';
}

export default function AdminReports() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Queries
  const { data: revenueData, loading: revenueLoading } = useAdminQuery(`/api/owner/analytics/revenue?period=${period}`, [period]);
  const { data: paymentsData, loading: paymentsLoading } = useAdminQuery(`/api/owner/analytics/payments`, []);
  const { data: peakHoursData, loading: peakHoursLoading } = useAdminQuery(`/api/owner/analytics/peak-hours`, []);
  const { data: mainAnalytics, loading: mainLoading } = useAdminQuery(`/api/owner/analytics`, []);

  // Stats extract
  const totalRevenue = revenueData?.totalRevenue ?? 0;
  const totalOrders = revenueData?.totalOrders ?? 0;
  const avgOrderValue = revenueData?.avgOrderValue ?? 0;
  const totalCustomers = mainAnalytics?.totalCustomers ?? 0;
  const rawDailyData = revenueData?.dailyData ?? [];
  const rawPaymentData = paymentsData?.breakdown ?? paymentsData ?? [];
  const rawTopDishes = mainAnalytics?.topSellingItems ?? [];
  const rawPeakHours = peakHoursData?.heatmap ?? peakHoursData ?? [];

  // Prepare robust chart data with fallback zero-series if DB has 0 records
  const dailyData = useMemo(() => {
    if (rawDailyData.length > 0) return rawDailyData;
    // Generate days of 0 values so axes and zero curve render beautifully
    const count = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return Array.from({ length: count }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (count - 1 - i));
      return {
        date: d.toISOString().slice(0, 10),
        revenue: 0,
        orders: 0,
      };
    });
  }, [rawDailyData, period]);

  const paymentAnalytics = useMemo(() => {
    if (rawPaymentData.length > 0) return rawPaymentData;
    return [
      { method: "COD", total: 0, count: 0 },
      { method: "JAZZCASH", total: 0, count: 0 },
      { method: "EASYPAISA", total: 0, count: 0 },
      { method: "CARD", total: 0, count: 0 },
    ];
  }, [rawPaymentData]);

  const topDishes = useMemo(() => rawTopDishes, [rawTopDishes]);

  // Build peak hours heatmap — expects [{day, hours:[{hour, count}]}]
  const peakHoursHeatmap = useMemo(() => {
    if (Array.isArray(rawPeakHours) && rawPeakHours.length > 0) return rawPeakHours;
    return [];
  }, [rawPeakHours]);

  const isDailyEmpty = dailyData.length === 0 || dailyData.every((d: any) => !d.revenue);
  const isPaymentEmpty = paymentAnalytics.every((p: any) => !p.total);

  const handleExportCSV = () => {
    const headers = 'Date,Revenue,Orders';
    const rows = dailyData.map((d: any) => `"${d.date}",${d.revenue || 0},${d.orders || 0}`);
    const csv = [headers, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Reports &amp; Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Business intelligence, payment channels and store peak operational trends.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
            {(['7d', '30d', '90d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700,
                  background: period === p ? 'var(--bg-card)' : 'none',
                  color: period === p ? 'var(--saffron)' : 'var(--text-secondary)',
                  boxShadow: period === p ? 'var(--shadow-sm)' : 'none',
                  border: 'none', cursor: 'pointer'
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 12px' }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Period Revenue</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
              Rs. {totalRevenue.toLocaleString()}
            </h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <DollarSign size={24} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed Orders</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
              {totalOrders}
            </h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)' }}>
            <ShoppingBag size={24} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Avg. Ticket Size</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
              Rs. {Math.round(avgOrderValue).toLocaleString()}
            </h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124,45,18,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon)' }}>
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Database Users</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
              {totalCustomers}
            </h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(59,130,246)' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Revenue Area Chart */}
        <div className="card" style={{ padding: '24px', position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Revenue Trend (Daily)</h3>
            {isDailyEmpty && (
              <span style={{ fontSize: "0.75rem", background: "var(--bg-secondary)", padding: "4px 10px", borderRadius: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                ℹ Zero records logged for selected period
              </span>
            )}
          </div>
          {revenueLoading ? <SkeletonCard h="300px" /> : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(tick) => tick.substring(5)} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="var(--saffron)" strokeWidth={3} dot={true} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Channels Breakdown */}
        <div className="card" style={{ padding: '24px', position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Payment Gateways Breakdown</h3>
            {isPaymentEmpty && (
              <span style={{ fontSize: "0.75rem", background: "var(--bg-secondary)", padding: "4px 10px", borderRadius: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                ℹ Zero completed payments
              </span>
            )}
          </div>
          {paymentsLoading ? <SkeletonCard h="300px" /> : (
            <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={paymentAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="method"
                  >
                    {paymentAnalytics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `Rs. ${parseInt(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.8rem', marginTop: '10px' }}>
                {paymentAnalytics.map((entry: any, idx: number) => (
                  <span key={entry.method} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                    {entry.method}: Rs. {Math.round(entry.total).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Peak Operational Hours Heatmap */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} /> Peak Delivery Hours Heatmap (Last 30 Days)
        </h3>
        {peakHoursLoading ? <SkeletonCard h="200px" /> : peakHoursHeatmap.length === 0 ? (
          <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', gap: 10 }}>
            <Clock size={40} style={{ opacity: 0.2 }} />
            <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>No peak hours data yet</p>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Order heatmap will appear here once daily orders are placed and delivered.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '780px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Heatmap header: Hours */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '80px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Day</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', flex: 1, gap: '2px', textAlign: 'center' }}>
                  {HOURS_LABEL.map(h => (
                    <span key={h} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</span>
                  ))}
                </div>
              </div>
              {/* Grid rows */}
              {peakHoursHeatmap.map((row: any) => (
                <div key={row.day} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '80px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{row.day}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', flex: 1, gap: '2px' }}>
                    {row.hours.map((h: any) => (
                      <div
                        key={h.hour}
                        title={`${row.day} ${h.hour}:00 — ${h.count} orders`}
                        style={{
                          height: '24px',
                          background: getHeatmapColor(h.count),
                          borderRadius: '3px',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = '')}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span>Legend: </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '2px', background: 'var(--bg-secondary)' }} /> 0 orders</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '2px', background: 'rgba(217, 119, 6, 0.15)' }} /> 1-2 orders</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '2px', background: 'rgba(217, 119, 6, 0.4)' }} /> 3-6 orders</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '2px', background: 'rgba(217, 119, 6, 0.75)' }} /> 7-14 orders</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '2px', background: 'var(--saffron)' }} /> 15+ peak</span>
            </div>
          </div>
        )}
      </div>

      {/* Top Dishes bar chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Top Product Sales</h3>
          {mainLoading ? <SkeletonCard h="280px" /> : topDishes.length === 0 ? (
            <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <ShoppingBag size={36} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>No product sales recorded yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Top selling items will be listed here after customer orders.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDishes} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} width={80} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Bar dataKey="quantity" name="Units Sold" fill="var(--maroon)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Best Sellers Performance</h3>
          {topDishes.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>No bestseller metrics yet</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Product performance metrics update automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topDishes.slice(0, 5).map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--saffron)' }}>{item.quantity} portions sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
