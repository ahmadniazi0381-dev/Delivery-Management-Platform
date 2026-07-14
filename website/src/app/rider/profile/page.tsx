"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function RiderProfilePage() {
  const { user, logout } = useAuth();
  return (
    <div className="fade-in">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "20px" }}>My Profile</h1>
      <div className="card" style={{ padding: "28px", maxWidth: "480px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "#fff", fontWeight: 700 }}>
            R
          </div>
          <div>
            <h2 style={{ fontWeight: 700, color: "var(--text-primary)" }}>{user?.name || "Rider"}</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{user?.phone}</p>
            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 600 }}>RIDER</span>
          </div>
        </div>
        <button
          onClick={() => { logout(); window.location.href = "/"; }}
          className="btn btn-danger"
          style={{ width: "100%", justifyContent: "center", color: "var(--error)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
