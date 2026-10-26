"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
    setIsRetrying(true);
    setTimeout(() => setIsRetrying(false), 1000);
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        const alertBox = document.getElementById("offline-alert");
        if (alertBox) {
          alertBox.style.animation = "none";
          void alertBox.offsetWidth;
          alertBox.style.animation = "shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both";
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
        background: "var(--bg-primary, #0C0705)",
        color: "var(--text-primary, #FFF9F3)",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        id="offline-alert"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "48px 32px",
          background: "var(--bg-card, #120A06)",
          borderRadius: "var(--radius-xl, 24px)",
          border: "1px solid var(--border-subtle, rgba(234, 88, 12, 0.1))",
          boxShadow: "var(--shadow-card, 0 12px 40px rgba(0,0,0,0.4))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Effect */}
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            height: "100px",
            background: "radial-gradient(ellipse at top, rgba(234,88,12,0.15), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(234, 88, 12, 0.1)",
            color: "var(--saffron, #EA580C)",
            marginBottom: "24px",
            animation: "pulseGlow 2s infinite cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <WifiOff size={40} />
        </div>

        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 800,
            color: "var(--text-primary, #FFF9F3)",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          You are offline
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary, #A89B95)",
            lineHeight: 1.6,
            marginBottom: "40px",
            maxWidth: "320px",
          }}
        >
          Check your internet connection and try again.
        </p>

        {isOnline ? (
          <div
            style={{
              padding: "12px 20px",
              background: "rgba(21, 128, 61, 0.1)",
              color: "#4ADE80",
              borderRadius: "var(--radius-md, 12px)",
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "24px",
              width: "100%",
              border: "1px solid rgba(74, 222, 128, 0.2)",
            }}
          >
            🟢 Internet connection restored!
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <button
            onClick={handleRetry}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "16px",
              borderRadius: "var(--radius-lg, 18px)",
              border: "none",
              background: "linear-gradient(135deg, var(--primary, #C2410C) 0%, #EA580C 100%)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)",
              transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          >
            <RefreshCw size={20} className={isRetrying ? "spin" : ""} />
            Try Reconnecting
          </button>

          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "16px",
              borderRadius: "var(--radius-lg, 18px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--text-secondary, #A89B95)",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              transition: "background 0.2s ease, color 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#FFF9F3";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.color = "var(--text-secondary, #A89B95)";
            }}
          >
            <Home size={20} />
            Back to Home
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); transform: scale(1); }
          70% { box-shadow: 0 0 0 20px rgba(234, 88, 12, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); transform: scale(1); }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
