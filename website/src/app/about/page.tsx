import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — Our Heritage & Quality Promise",
  description:
    "Discover our delivery platform. Handcrafted with quality ingredients, great taste, and fast doorstep delivery.",
};

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "92vh" }}>
      <div style={{ background: "var(--bg-secondary)", padding: "60px 20px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div
            className="section-tag"
            style={{
              display: "inline-block",
              color: "#C2410C",
              background: "#FFF4E8",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontWeight: 700,
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            ⚡ Our Story &amp; Promise
          </div>
          <h1
            className="section-title"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
              fontWeight: 900,
              color: "var(--text-primary)",
              marginTop: "8px",
              lineHeight: 1.2,
            }}
          >
            About Delivery Platform
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.1rem",
              marginTop: "16px",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "16px auto 0",
            }}
          >
            Serving fresh, delicious food with piping-hot delivery, live order tracking, and reliable service.
          </p>
        </div>
      </div>

      <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Narrative Card */}
        <div
          className="card"
          style={{
            padding: "clamp(24px, 4vw, 36px)",
            marginBottom: "40px",
            lineHeight: 1.8,
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <h2
            style={{
              fontSize: "1.45rem",
              marginBottom: "16px",
              color: "#9A3412",
              fontWeight: 800,
            }}
          >
            Fresh Food, Delivered Fast
          </h2>
          <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
            Delivery Platform brings hot, fresh meals straight to your doorstep. Every order is freshly prepared, carefully packaged, and delivered with care and speed.
          </p>
          <p style={{ marginBottom: "16px", color: "var(--text-secondary)" }}>
            Our online platform features a streamlined order flow, real-time live map tracking via WebSockets, and multiple payment options including Cash on Delivery, JazzCash, Easypaisa, and digital debit/credit cards.
          </p>
          <p style={{ color: "var(--text-secondary)" }}>
            With our dedicated delivery fleet, your meal is dispatched immediately and delivered steaming hot within 30 minutes.
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {[
            { value: "Live", label: "Real-Time Tracking" },
            { value: "<30 Mins", label: "Average Delivery" },
            { value: "100%", label: "Secure Payments" },
            { value: "Fresh", label: "Made to Order Daily" },
          ].map((stat, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "20px 16px",
                textAlign: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  color: "#EA580C",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginTop: "6px",
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: "center", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/menu"
            className="btn btn-primary"
            style={{
              padding: "14px 36px",
              fontSize: "1.05rem",
              fontWeight: 700,
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #EA580C, #C2410C)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "var(--shadow-md)",
            }}
          >
            Explore Menu 🛒
          </Link>
          <Link
            href="/contact"
            className="btn btn-ghost"
            style={{
              padding: "14px 32px",
              fontSize: "1.05rem",
              fontWeight: 700,
              borderRadius: "var(--radius-full)",
              border: "1.5px solid var(--border-color)",
              textDecoration: "none",
            }}
          >
            Contact Kitchen 📞
          </Link>
        </div>
      </div>
    </div>
  );
}
