"use client";

import React, { useEffect, useState } from "react";
import { Bike, Package, Clock, CheckCircle2, TrendingUp, Star, MapPin } from "lucide-react";

const MOCK_ASSIGNED = [
  { id: "ord-201", customer: "Ahmed Raza", address: "House 12, Block A, UCP Housing, Lahore", items: "1× Special Biryani, 1× Raita", amount: 420, status: "out_for_delivery", distance: "1.2km", time: "8 mins" },
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
    <div style={{ background: "var(--bg-primary, #0C0705)", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Header */}
        <div style={{ 
          background: "var(--bg-card, #120A06)", 
          padding: "32px", 
          borderRadius: "var(--radius-xl, 24px)",
          border: "1px solid var(--border-subtle, rgba(234, 88, 12, 0.1))",
          boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary, #FFF9F3)", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
              <Bike size={32} color="#EA580C" /> Rider Dashboard
            </h1>
            <p style={{ color: "var(--text-secondary, #A89B95)", fontSize: "1rem", margin: "8px 0 0 0" }}>Your active deliveries and today's performance.</p>
          </div>
          
          {/* Rider Status Badge */}
          <div style={{
            background: "rgba(234, 88, 12, 0.1)",
            border: "1px solid rgba(234, 88, 12, 0.2)",
            color: "var(--saffron, #EA580C)",
            padding: "8px 16px",
            borderRadius: "99px",
            fontSize: "0.9rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EA580C", animation: "pulse 2s infinite" }} />
            ACTIVE
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          {[
            { label: "Ongoing", value: ongoingCount, icon: "🏃", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
            { label: "Ready to Pick", value: readyCount, icon: "📦", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
            { label: "Delivered Today", value: completed.length, icon: "✅", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)" },
            { label: "Today's Earnings", value: `Rs. ${todayEarnings.toFixed(0)}`, icon: "💰", color: "#EA580C", bg: "rgba(234, 88, 12, 0.1)" },
          ].map(stat => (
            <div key={stat.label} style={{ 
              background: "var(--bg-card, #120A06)", 
              padding: "24px", 
              borderRadius: "var(--radius-lg, 18px)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
              textAlign: "center"
            }}>
              <div style={{ width: "56px", height: "56px", margin: "0 auto 16px", borderRadius: "50%", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)", marginTop: "4px", fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Assigned Orders */}
        <div style={{ 
          background: "var(--bg-card, #120A06)", 
          padding: "32px", 
          borderRadius: "var(--radius-xl, 24px)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary, #FFF9F3)", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Package size={24} color="#EA580C" /> Assigned Orders ({assigned.length})
          </h3>
          
          {assigned.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-secondary, #A89B95)", background: "var(--bg-input, #1A0E08)", borderRadius: "var(--radius-lg, 18px)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
              <p style={{ fontSize: "1.1rem" }}>All deliveries complete! Great job today.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {assigned.map(order => (
                <div
                  key={order.id}
                  style={{
                    padding: "24px",
                    border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
                    borderRadius: "var(--radius-lg, 18px)",
                    background: "var(--bg-input, #1A0E08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "20px",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Left Accent border */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: order.status === "out_for_delivery" ? "#EA580C" : "#3B82F6" }} />

                  <div style={{ flex: 1, paddingLeft: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <span style={{ fontWeight: 800, color: "var(--text-primary, #FFF9F3)", fontSize: "1.1rem" }}>#{order.id}</span>
                      <span style={{
                        fontSize: "0.8rem",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        background: order.status === "out_for_delivery" ? "rgba(234, 88, 12, 0.1)" : "rgba(59, 130, 246, 0.1)",
                        color: order.status === "out_for_delivery" ? "#EA580C" : "#3B82F6",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        {order.status === "out_for_delivery" ? "🏃 Delivering" : "📦 Ready to Pick"}
                      </span>
                    </div>
                    
                    <p style={{ fontWeight: 700, color: "var(--text-primary, #FFF9F3)", marginBottom: "8px", fontSize: "1.05rem" }}>{order.customer}</p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={16} /> {order.address}
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)", marginBottom: "16px", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                      🍛 {order.items}
                    </p>
                    
                    <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--text-secondary, #A89B95)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><TrendingUp size={14} /> {order.distance}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {order.time}</span>
                      <span style={{ fontWeight: 800, color: "var(--saffron, #EA580C)", fontSize: "0.95rem" }}>Rs. {order.amount}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => markDelivered(order.id)}
                    className="btn-premium"
                    style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <CheckCircle2 size={18} /> Mark Delivered
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completions */}
        <div style={{ 
          background: "var(--bg-card, #120A06)", 
          padding: "32px", 
          borderRadius: "var(--radius-xl, 24px)",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary, #FFF9F3)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            ✅ Completed Today ({completed.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {completed.map(order => (
              <div key={order.id} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "16px 20px", 
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))", 
                borderRadius: "var(--radius-lg, 18px)",
                background: "var(--bg-input, #1A0E08)"
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary, #FFF9F3)", marginRight: "12px" }}>#{order.id}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary, #A89B95)" }}>{order.customer}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: "#10B981" }}>+Rs. {(order.amount * 0.1).toFixed(0)}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #736760)", marginTop: "2px" }}>{order.completedAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-premium {
          background: linear-gradient(135deg, var(--primary, #C2410C) 0%, #EA580C 100%);
          color: #FFFFFF;
          border-radius: var(--radius-lg, 18px);
          border: none;
          font-weight: 700;
          padding: 14px 24px;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
          transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(234, 88, 12, 0.4);
        }
        .btn-premium:active {
          transform: translateY(0);
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
