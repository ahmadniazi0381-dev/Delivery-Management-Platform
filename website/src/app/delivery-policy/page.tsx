import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: "Learn about delivery radius, delivery times (11 AM - 11 PM), fee structures, and rider safety policies for Delivery Platform.",
};

export default function DeliveryPolicyPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "92vh" }}>
      <div style={{ background: "var(--bg-secondary)", padding: "60px 20px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h1 className="section-title" style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.5rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-primary)", lineHeight: 1.2 }}>
            Delivery Policy
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>
            Last updated: July 9, 2026
          </p>
        </div>
      </div>

      <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, fontSize: "1rem", background: "var(--bg-card)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>1.</span> Delivery Radius & Area
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              We deliver strictly within our marked delivery zone. The system uses coordinate distance checks to verify order delivery eligibility.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>2.</span> Delivery Timings
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Deliveries are dispatched during operational hours: <strong style={{ color: "var(--text-primary)" }}>11:00 AM – 11:00 PM</strong>. Average delivery times range from 20 to 35 minutes depending on order volume and traffic. Heavy rain or peak lunch/dinner rush hours might cause temporary delays.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>3.</span> Charges Structure
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              We charge a flat base delivery fee of <strong style={{ color: "var(--text-primary)" }}>Rs. 50</strong> for orders within 1 km, and an additional distance fee as defined in our delivery settings. Free delivery may apply during promotional periods or for orders exceeding a minimum checkout amount.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>4.</span> Rider Safety
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Our deliveries are handled by dedicated in-house staff. In case of extreme weather conditions or road closures, delivery times may be adjusted or temporarily suspended to ensure team safety.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
