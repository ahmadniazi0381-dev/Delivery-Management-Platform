import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "Sorry, the page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <div
        className="card animate-scale-in"
        style={{
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
          padding: "50px 30px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            fontSize: "5rem",
            marginBottom: "16px",
            lineHeight: 1,
            animation: "float 3s ease-in-out infinite",
          }}
        >
          🍛
        </div>

        <span
          className="section-tag"
          style={{
            background: "rgba(234, 88, 12, 0.12)",
            color: "#C2410C",
            fontWeight: 800,
            marginBottom: "16px",
          }}
        >
          Error 404
        </span>

        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2rem, 5vw, 2.75rem)",
            color: "var(--text-primary)",
            marginBottom: "12px",
            lineHeight: 1.15,
          }}
        >
          Dish Not Found!
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            maxWidth: "460px",
            margin: "0 auto 32px",
          }}
        >
          The page or order you are looking for seems to have vanished from the kitchen. It might have been moved or doesn&apos;t exist.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            className="btn btn-primary"
            style={{
              padding: "14px 28px",
              fontSize: "0.95rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🏠 Back to Home
          </Link>
          <Link
            href="/menu"
            className="btn btn-secondary"
            style={{
              padding: "14px 28px",
              fontSize: "0.95rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🍽️ Browse Menu
          </Link>
          <Link
            href="/track"
            className="btn btn-ghost"
            style={{
              padding: "14px 28px",
              fontSize: "0.95rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📍 Track Order
          </Link>
        </div>

        <div
          style={{
            marginTop: "36px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-color)",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          Need help?{" "}
          <Link
            href="/contact"
            style={{
              color: "#EA580C",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Contact Customer Support
          </Link>
          {" "}or call{" "}
          <a
            href="tel:+923054311118"
            style={{
              color: "#EA580C",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            +92 305 4311118
          </a>
        </div>
      </div>
    </div>
  );
}
