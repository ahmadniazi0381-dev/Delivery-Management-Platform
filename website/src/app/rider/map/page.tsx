"use client";
import React from "react";
import { MapPin } from "lucide-react";

export default function RiderMapPage() {
  return (
    <div className="fade-in">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "8px" }}>Live Map</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>Real-time delivery route tracking.</p>
      <div
        className="card"
        style={{
          height: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "var(--bg-secondary)",
        }}
      >
        <MapPin size={48} color="var(--saffron)" />
        <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Google Maps integration — coming soon.</p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Will show live delivery routes and restaurant location.</p>
      </div>
    </div>
  );
}
