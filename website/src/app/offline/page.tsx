"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        // Simple animation/shake effect could be added, or just alert
        const alertBox = document.getElementById("offline-alert");
        if (alertBox) {
          alertBox.style.animation = "none";
          // Trigger reflow
          void alertBox.offsetWidth;
          alertBox.style.animation = "shake 0.5s ease";
        }
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-secondary, #FEF9F0)",
        color: "var(--text-primary, #1C0A00)",
        padding: "20px",
        textAlign: "center",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div
        id="offline-alert"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 30px",
          background: "var(--bg-card, #FFFFFF)",
          borderRadius: "var(--radius-lg, 18px)",
          boxShadow: "var(--shadow-lg, 0 8px 32px rgba(124, 45, 18, 0.16))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Animated Offline Icon */}
        <div
          style={{
            fontSize: "4.5rem",
            marginBottom: "24px",
            animation: "pulse 2s infinite",
          }}
        >
          🍛📡
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--maroon, #7C2D12)",
            marginBottom: "12px",
            lineHeight: 1.2,
          }}
        >
          Connection Lost
        </h1>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary, #6B4226)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          It looks like you are currently offline. Check your internet connection to continue ordering Karachi&apos;s best biryani &amp; pulao!
        </p>

        {isOnline ? (
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(21, 128, 61, 0.1)",
              color: "var(--success, #15803D)",
              borderRadius: "var(--radius-md, 12px)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "24px",
              width: "100%",
            }}
          >
            🟢 Internet connection restored!
          </div>
        ) : null}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <button
            onClick={handleRetry}
            style={{
              width: "100%",
              padding: "14px 28px",
              borderRadius: "99px",
              border: "none",
              background: "var(--grad-saffron, linear-gradient(135deg, #D97706 0%, #F59E0B 100%))",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "var(--shadow-saffron, 0 4px 20px rgba(217, 119, 6, 0.30))",
              transition: "transform 0.2s ease, opacity 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            🔄 Try Reconnecting
          </button>

          <Link
            href="/"
            style={{
              width: "100%",
              padding: "14px 28px",
              borderRadius: "99px",
              border: "1.5px solid var(--border-color, #F5E6D0)",
              background: "transparent",
              color: "var(--text-secondary, #6B4226)",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              transition: "background 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-secondary, #FEF9F0)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            🏠 Back to Home
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
