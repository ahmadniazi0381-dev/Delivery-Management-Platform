"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useOrderAlerts } from "./hooks/useOrderAlerts";
import { ToastProvider, useToast } from "@/components/AdminToast";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Utensils,
  Settings,
  Sun,
  Moon,
  LogOut,
  Bell,
  ChevronLeft,
} from "lucide-react";

// ─── Navigation links ─────────────────────────────────────────────────────────

const ADMIN_LINKS = [
  { href: "/dashboard",           label: "Dashboard",          icon: TrendingUp },
  { href: "/dashboard/orders",    label: "Orders",             icon: ShoppingBag },
  { href: "/dashboard/menu",      label: "Menu & Categories",  icon: Utensils },
  { href: "/dashboard/customers", label: "Customers",          icon: Users },
  { href: "/dashboard/riders",    label: "Riders",             icon: Users },
  { href: "/dashboard/reports",   label: "Reports & Analytics",icon: TrendingUp },
  { href: "/dashboard/settings",  label: "Settings",           icon: Settings },
];

// ─── Inner layout (needs toast context) ──────────────────────────────────────

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { joinAsAdmin, isConnected } = useSocket();
  const { addToast } = useToast();

  // ── Order alerts (runs for the entire admin session) ──────────────────────
  const { pendingCount, latestOrder } = useOrderAlerts({
    onNewOrder: (order) => {
      addToast({
        type: "warning",
        title: "🔴 New Order Received!",
        message: `Order #${order.orderNumber} — ${order.itemsCount} item(s) — Rs. ${order.total}`,
        duration: 8000,
      });
    },
    onOrderResolved: (orderId) => {
      addToast({
        type: "info",
        title: "Order Updated",
        message: `Order #${orderId} has been resolved.`,
        duration: 3000,
      });
    },
  });

  // ── Join admin socket room on connect ─────────────────────────────────────
  useEffect(() => {
    if (isConnected) {
      const token = localStorage.getItem("naseeb_token");
      if (token) joinAsAdmin(token);
    }
  }, [isConnected, joinAsAdmin]);

  // ── Theme sync ────────────────────────────────────────────────────────────
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
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const hasPending = pendingCount > 0;

  return (
    <>
      {/* CSS for alert animations */}
      <style>{`
        @keyframes pulse-pending {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes flash-icon {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.6); }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .pending-pulse {
          animation: pulse-pending 1.2s ease-in-out infinite;
        }
        .flash-alert {
          animation: flash-icon 0.8s ease-in-out infinite;
        }
        .badge-pop {
          animation: badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .socket-dot {
          width: 8px; height: 8px; border-radius: 50%;
          transition: background 0.4s ease;
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)" }}>
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          style={{
            width: collapsed ? "70px" : "260px",
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
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 800, color: "var(--maroon)", fontSize: "1.1rem" }}>
                  Naseeb Admin
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Control Center
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)", padding: "4px",
                borderRadius: "4px", display: "flex", alignItems: "center",
              }}
            >
              <ChevronLeft
                size={20}
                style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const isOrders = link.href === "/dashboard/orders";
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
                    background: active ? "rgba(217,119,6,0.1)" : "transparent",
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    justifyContent: collapsed ? "center" : "flex-start",
                    position: "relative",
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <span
                    style={{ position: "relative", flexShrink: 0 }}
                    className={isOrders && hasPending ? "flash-alert" : ""}
                  >
                    <Icon size={20} />
                    {/* Pending dot on icon */}
                    {isOrders && hasPending && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          border: "2px solid var(--bg-card)",
                        }}
                        className="pending-pulse"
                      />
                    )}
                  </span>
                  {!collapsed && <span style={{ flex: 1 }}>{link.label}</span>}
                  {/* Pending count badge in sidebar */}
                  {!collapsed && isOrders && hasPending && (
                    <span
                      className="badge-pop"
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: "12px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={toggleTheme}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px", borderRadius: "8px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-secondary)",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
            </button>
            <button
              onClick={() => { logout(); window.location.href = "/"; }}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px", borderRadius: "8px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--error)",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <LogOut size={20} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────────── */}
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
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Welcome, {user?.name || "Administrator"}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Socket status dot */}
              <span
                className="socket-dot"
                title={isConnected ? "Live — connected" : "Disconnected"}
                style={{ background: isConnected ? "#10b981" : "#6b7280" }}
              />

              {/* Bell icon with pending count badge */}
              <Link
                href="/dashboard/orders"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: hasPending ? "#ef4444" : "var(--text-secondary)",
                  position: "relative", padding: "6px",
                  display: "flex", alignItems: "center",
                  textDecoration: "none",
                }}
                title={hasPending ? `${pendingCount} pending order(s)` : "Notifications"}
                className={hasPending ? "flash-alert" : ""}
              >
                <Bell size={22} />
                {hasPending && (
                  <span
                    className="badge-pop"
                    style={{
                      position: "absolute",
                      top: "0px",
                      right: "0px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      border: "2px solid var(--bg-card)",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>

              {/* Admin avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
                <div
                  style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "var(--grad-saffron)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.9rem",
                  }}
                >
                  A
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }} className="hide-mobile">
                  Owner Mode
                </span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Public export — wraps inner layout with ToastProvider ───────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ToastProvider>
  );
}
