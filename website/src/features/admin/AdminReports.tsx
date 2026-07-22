"use client";
import React, { useState } from 'react';
import { useAdminQuery } from './hooks/useAdminApi';
import { SkeletonCard } from './components/SkeletonLoader';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

const COLORS = ['#D97706', '#7C2D12', '#15803D', '#2563EB', '#7C3AED'];

export default function AdminReports() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Queries
  const { data: revenueData, loading: revenueLoading } = useAdminQuery(`/owner/analytics/revenue?period=${period}`, [period]);
  const { data: paymentsData, loading: paymentsLoading } = useAdminQuery(`/owner/analytics/payments`, []);
  const { data: peakHoursData, loading: peakHoursLoading } = useAdminQuery(`/owner/analytics/peak-hours`, []);
  const { data: mainAnalytics, loading: mainLoading } = useAdminQuery(`/owner/analytics`, []);

  // Stats extract
  const totalRevenue = revenueData?.totalRevenue ?? 0;
  const totalOrders = revenueData?.totalOrders ?? 0;
  const avgOrderValue = revenueData?.avgOrderValue ?? 0;
  const totalCustomers = mainAnalytics?.totalCustomers ?? 0;

  const dailyData = revenueData?.dailyData ?? [];
  const paymentAnalytics = paymentsData?.data || paymentsData || [];
  const topDishes = mainAnalytics?.topSellingItems ?? [];
  
  // Build Heatmap grid
  const peakHoursHeatmap = peakHoursData?.heatmap ?? [];
  const hoursLabel = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const handleExportCSV = () => {
    if (dailyData.length === 0) return;
    const headers = ['Date', 'Revenue (Rs.)', 'Orders Count'];
    const rows = dailyData.map((d: any) => [d.date, d.revenue, d.orders]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `naseeb_revenue_daily_${period}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'var(--bg-secondary)';
    if (count < 3) return 'rgba(217, 119, 6, 0.15)'; // light saffron
    if (count < 7) return 'rgba(217, 119, 6, 0.4)';  // medium saffron
    if (count < 15) return 'rgba(217, 119, 6, 0.75)'; // strong saffron
    return 'var(--saffron)'; // peak saffron
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Reports & Analytics</h1>
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
      <div className="admin-reports-grid-1">
        {/* Revenue Area Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Revenue Trend (Daily)</h3>
          {revenueLoading ? <SkeletonCard h="300px" /> : (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(tick) => tick.substring(5)} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="var(--saffron)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Channels Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Payment Gateways Breakdown</h3>
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
        {peakHoursLoading ? <SkeletonCard h="200px" /> : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '780px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Heatmap header: Hours */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '80px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Day</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', flex: 1, gap: '2px', textAlign: 'center' }}>
                  {hoursLabel.map(h => (
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
      <div className="admin-reports-grid-2">
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Top Product Sales</h3>
          {mainLoading ? <SkeletonCard h="280px" /> : (
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
        </div>
      </div>
    </div>
  );
}
