"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useOrderAlerts } from "./hooks/useOrderAlerts";
import { ToastProvider, useToast } from "@/components/AdminToast";
import { GlobalSearch, GlobalSearchTrigger } from "@/components/GlobalSearch";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Utensils,
  Settings,
  Sun,
  Moon,
  LogOut,
  Bell,
  ChevronLeft,
  Bike,
  BarChart2,
  Menu,
  X,
  UserCog,
  Monitor,
  Activity,
  Package,
  TrendingUp,
  DollarSign,
} from "lucide-react";

// ─── Navigation links ─────────────────────────────────────────────────────────

const ADMIN_LINKS = [
  { href: "/dashboard",             label: "Overview",            icon: LayoutDashboard },
  { href: "/dashboard/orders",      label: "Orders",              icon: ShoppingBag },
  { href: "/dashboard/menu",        label: "Menu",                icon: Utensils },
  { href: "/dashboard/riders",      label: "Riders",              icon: Bike },
  { href: "/dashboard/staff",       label: "Staff",               icon: UserCog },
  { href: "/dashboard/analytics",   label: "Analytics",           icon: TrendingUp },
  { href: "/dashboard/settings",    label: "Settings",            icon: Settings },
];

// ─── Inner layout (needs toast context) ──────────────────────────────────────

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { joinAsAdmin, isConnected } = useSocket();
  const { addToast } = useToast();

  // ── Auto-close mobile drawer on route change ──────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // ── Prevent body scrolling when mobile drawer is open ──────────────────────
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // ── Close mobile drawer on Escape key ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Order alerts (runs for the entire admin session) ──────────────────────
  const { pendingCount } = useOrderAlerts({
    onNewOrder: (order) => {
      try {
        const audio = new Audio('/alert.mp3'); // Fallback or assume public asset
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) {}

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

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* CSS for alert animations & mobile responsive drawer */}
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

        /* Desktop vs Mobile sidebar styles */
        .admin-sidebar-desktop {
          display: flex;
        }
        .admin-hamburger-btn {
          display: none;
        }
        .admin-mobile-drawer {
          display: none;
        }

        @media (max-width: 1023px) {
          .admin-sidebar-desktop {
            display: none !important;
          }
          .admin-hamburger-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            padding: 8px;
            border-radius: 8px;
            background: none;
            border: 1px solid var(--border);
            color: var(--text-primary);
            cursor: pointer;
          }
          .admin-mobile-drawer {
            display: block;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)" }}>
        {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
        <aside
          className="admin-sidebar-desktop"
          style={{
            width: collapsed ? "70px" : "260px",
            background: "var(--bg-card)",
            borderRight: "1px solid var(--border)",
            flexDirection: "column",
            transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            position: "sticky",
            top: 0,
            height: "100vh",
            zIndex: 100,
            flexShrink: 0,
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
                  Delivery Platform
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Admin Console
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
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                size={20}
                style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const isOrders = link.href === "/dashboard/orders";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(194,65,12,0.06)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 12px 12px 8px",
                    borderRadius: "8px",
                    color: active ? "var(--saffron)" : "var(--text-secondary)",
                    background: active ? "rgba(217,119,6,0.08)" : "transparent",
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    transition: "all 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
                    justifyContent: collapsed ? "center" : "flex-start",
                    position: "relative",
                    borderLeft: active ? "3px solid var(--saffron)" : "3px solid transparent",
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  <span
                    style={{ position: "relative", flexShrink: 0 }}
                    className={isOrders && hasPending ? "flash-alert" : ""}
                  >
                    <Icon size={20} />
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
              onClick={() => { logout(); window.location.href = "/"; }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px", borderRadius: "8px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--error)",
                transition: "background 0.22s ease",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <LogOut size={20} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* ── Mobile Off-Canvas Drawer (Overlay) ────────────────────────────── */}
        <div className="admin-mobile-drawer">
          <>
            {/* Dark Backdrop Overlay */}
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 999,
                opacity: mobileOpen ? 1 : 0,
                pointerEvents: mobileOpen ? 'all' : 'none',
                transition: 'opacity 0.25s ease',
              }}
            />
            {/* Off-canvas Drawer Panel */}
            <aside
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "min(280px, 85vw)",
                background: "var(--bg-card)",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
                {/* Mobile Drawer Header */}
                <div
                  style={{
                    height: "72px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 800, color: "var(--maroon)", fontSize: "1.1rem" }}>
                      Delivery Platform
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Admin Console
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-secondary)", padding: "6px",
                      borderRadius: "6px", display: "flex", alignItems: "center",
                    }}
                    aria-label="Close menu"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Mobile Drawer Nav Links */}
                <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
                  {ADMIN_LINKS.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    const isOrders = link.href === "/dashboard/orders";
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleNavClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 16px",
                          borderRadius: "8px",
                          color: active ? "var(--saffron)" : "var(--text-secondary)",
                          background: active ? "rgba(217,119,6,0.1)" : "transparent",
                          fontWeight: active ? 700 : 500,
                          textDecoration: "none",
                          borderLeft: active ? "4px solid var(--saffron)" : "4px solid transparent",
                        }}
                      >
                        <Icon size={20} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{link.label}</span>
                        {isOrders && hasPending && (
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

                {/* Mobile Drawer Footer */}
                <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); window.location.href = "/"; }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px", borderRadius: "8px", width: "100%",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--error)",
                    }}
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </aside>
          </>
        </div>

        {/* ── Main Content Container ────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%" }}>
          {/* Top Header */}
          <header
            style={{
              height: "72px",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 clamp(12px, 3vw, 24px)",
              position: "sticky",
              top: 0,
              zIndex: 90,
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              {/* Hamburger Button for Mobile */}
              <button
                onClick={() => setMobileOpen(true)}
                className="admin-hamburger-btn"
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>

              <h2
                style={{
                  fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Welcome, {user?.name || "Administrator"}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              {/* Global Search Ctrl+K trigger */}
              <div
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(194,65,12,0.08)';
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(194,65,12,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.border = '1px solid transparent';
                }}
                style={{
                  borderRadius: '6px',
                  border: '1px solid transparent',
                  transition: 'all 0.22s ease',
                  display: 'flex',
                }}
              >
                <GlobalSearchTrigger onClick={() => { const evt = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }); window.dispatchEvent(evt); }} />
              </div>

              {/* Socket status dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="socket-dot"
                  title={isConnected ? 'Live — connected' : 'Offline'}
                  style={{
                    background: isConnected ? '#10b981' : '#6b7280',
                    boxShadow: isConnected ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
                    transition: 'background 0.4s ease, box-shadow 0.4s ease',
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EA580C'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-secondary)", padding: "6px",
                  display: "flex", alignItems: "center",
                  transition: "color 0.22s ease",
                }}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

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
                    className="badge-pop pending-pulse"
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
                <div
                  style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: "var(--grad-saffron)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }} className="hide-mobile">
                  {user?.name || 'Administrator'}
                </span>
              </div>
            </div>
          </header>

          {/* Global Search Modal (Ctrl+K) */}
          <GlobalSearch />

          {/* Page Content */}
          <main style={{ flex: 1, padding: "clamp(12px, 2.5vw, 24px)", overflowY: "auto", minWidth: 0, width: "100%" }}>
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
