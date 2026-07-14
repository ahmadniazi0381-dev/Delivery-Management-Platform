"use client";

import React, { useEffect, useState } from "react";
import { Bike, Package, Clock, CheckCircle2, TrendingUp, Star } from "lucide-react";

const MOCK_ASSIGNED = [
  { id: "ord-201", customer: "Ahmed Raza", address: "House 12, Block A, UCP Housing, Lahore", items: "1× Naseeb Special Biryani, 1× Raita", amount: 420, status: "out_for_delivery", distance: "1.2km", time: "8 mins" },
  { id: "ord-202", customer: "Sara Khan", address: "Plot 7, Canal Road, Lahore", items: "2× Sada Pulao (Double)", amount: 700, status: "ready", distance: "2.1km", time: "12 mins" },
];

const MOCK_COMPLETED = [
  { id: "ord-190", customer: "Ali Hassan", address: "DHA Phase 6, Lahore", amount: 350, completedAt: "Today, 1:10 PM" },
  { id: "ord-188", customer: "Fatima Malik", address: "Johar Town, Lahore", amount: 560, completedAt: "Today, 11:45 AM" },
  { id: "ord-185", customer: "Usman Tariq", address: "Model Town, Lahore", amount: 420, completedAt: "Today, 10:20 AM" },
];

export default function RiderDashboard() {
  const [assigned, setAssigned] = useState(MOCK_ASSIGNED);
  const [completed, setCompleted] = useState(MOCK_COMPLETED);

  const todayEarnings = completed.reduce((sum, o) => sum + o.amount * 0.1, 0);
  const ongoingCount = assigned.filter(o => o.status === "out_for_delivery").length;
  const readyCount = assigned.filter(o => o.status === "ready").length;

  const markDelivered = (id: string) => {
    const order = assigned.find(o => o.id === id);
    if (!order) return;
    setAssigned(prev => prev.filter(o => o.id !== id));
    setCompleted(prev => [{ id: order.id, customer: order.customer, address: order.address, amount: order.amount, completedAt: "Just now" }, ...prev]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="fade-in">
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Rider Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Your active deliveries and today's performance.</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
        {[
          { label: "Ongoing", value: ongoingCount, icon: "🏃", color: "#f59e0b" },
          { label: "Ready to Pick", value: readyCount, icon: "📦", color: "#3b82f6" },
          { label: "Delivered Today", value: completed.length, icon: "✅", color: "#10b981" },
          { label: "Today's Earnings", value: `Rs. ${todayEarnings.toFixed(0)}`, icon: "💰", color: "#8b5cf6" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Assigned Orders */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
          📋 Assigned Orders ({assigned.length})
        </h3>
        {assigned.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
            <p>All deliveries complete! Great job today.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {assigned.map(order => (
              <div
                key={order.id}
                style={{
                  padding: "16px",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  background: "var(--bg-secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>#{order.id}</span>
                    <span style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: order.status === "out_for_delivery" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                      color: order.status === "out_for_delivery" ? "#f59e0b" : "#3b82f6",
                      fontWeight: 600
                    }}>
                      {order.status === "out_for_delivery" ? "🏃 Delivering" : "📦 Ready to Pick"}
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{order.customer}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>📍 {order.address}</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>🍛 {order.items}</p>
                  <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span>📏 {order.distance}</span>
                    <span>⏱ Est. {order.time}</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Rs. {order.amount}</span>
                  </div>
                </div>
                <button
                  onClick={() => markDelivered(order.id)}
                  className="btn btn-primary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <CheckCircle2 size={16} /> Mark Delivered
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completions */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
          ✅ Completed Today ({completed.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {completed.map(order => (
            <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)", marginRight: "8px" }}>#{order.id}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{order.customer}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "var(--success)" }}>+Rs. {(order.amount * 0.1).toFixed(0)}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{order.completedAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
