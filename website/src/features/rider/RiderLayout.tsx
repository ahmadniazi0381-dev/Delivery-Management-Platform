"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  LogOut,
  Sun,
  Moon,
  Bike,
  ChevronLeft
} from "lucide-react";

const RIDER_LINKS = [
  { href: "/rider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rider/deliveries", label: "My Deliveries", icon: Package },
  { href: "/rider/map", label: "Live Map", icon: MapPin },
  { href: "/rider/profile", label: "My Profile", icon: User },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("naseeb_theme");
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("naseeb_theme", next ? "dark" : "light");
  };

  const isActive = (href: string) => {
    if (href === "/rider") return pathname === "/rider";
    return pathname.startsWith(href);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)" }}>
      {/* Rider Sidebar */}
      <aside
        style={{
          width: collapsed ? "70px" : "240px",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "0 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bike size={22} color="var(--saffron)" />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 800, color: "var(--maroon)", fontSize: "1rem" }}>
                  Rider Portal
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Naseeb Delivery
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={20} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>

        {/* Rider status badge */}
        {!collapsed && (
          <div style={{ margin: "12px", padding: "10px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981" }}>Online — Ready</span>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {RIDER_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  color: active ? "var(--saffron)" : "var(--text-secondary)",
                  background: active ? "rgba(217, 119, 6, 0.1)" : "transparent",
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  justifyContent: collapsed ? "center" : "flex-start",
                  fontSize: "0.9rem",
                }}
                title={collapsed ? link.label : undefined}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <button
            onClick={toggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {!collapsed && <span style={{ fontSize: "0.9rem" }}>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={() => { logout(); window.location.href = "/"; }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "8px",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--error)",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <LogOut size={20} />
            {!collapsed && <span style={{ fontSize: "0.9rem" }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: "72px",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            👋 Hey, {user?.name?.split(" ")[0] || "Rider"}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#10b981",
              }}
            >
              🟢 Online
            </div>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              R
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
