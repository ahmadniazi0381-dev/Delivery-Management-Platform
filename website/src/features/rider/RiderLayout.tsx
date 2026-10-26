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
  ChevronLeft,
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-secondary)" }}>
      {/* CSS for Responsive Rider Drawer */}
      <style>{`
        .rider-sidebar-desktop {
          display: flex;
        }
        .rider-hamburger-btn {
          display: none;
        }
        .rider-mobile-drawer {
          display: none;
        }
        @media (max-width: 1023px) {
          .rider-sidebar-desktop {
            display: none !important;
          }
          .rider-hamburger-btn {
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
          .rider-mobile-drawer {
            display: block;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── Desktop Rider Sidebar ────────────────────────────────────────────── */}
      <aside
        className="rider-sidebar-desktop"
        style={{
          width: collapsed ? "70px" : "240px",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          flexDirection: "column",
          transition: "width 0.2s ease",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bike size={22} color="var(--saffron)" />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 800, color: "var(--maroon)", fontSize: "1rem" }}>
                  Rider Portal
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Delivery Platform
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
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
        <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
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

      {/* ── Mobile Off-Canvas Drawer (Overlay) ────────────────────────────── */}
      <div className="rider-mobile-drawer">
        {mobileOpen && (
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
                animation: "fadeIn 0.2s ease-out",
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
                animation: "slideRight 0.25s ease-out",
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Bike size={22} color="var(--saffron)" />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 800, color: "var(--maroon)", fontSize: "1rem" }}>
                      Rider Portal
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Delivery Platform
                    </span>
                  </div>
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

              {/* Status badge */}
              <div style={{ margin: "12px 16px 0", padding: "10px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981" }}>Online — Ready</span>
                </div>
              </div>

              {/* Mobile Drawer Nav Links */}
              <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
                {RIDER_LINKS.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
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
                        background: active ? "rgba(217, 119, 6, 0.1)" : "transparent",
                        fontWeight: active ? 700 : 500,
                        textDecoration: "none",
                        fontSize: "0.95rem",
                        borderLeft: active ? "4px solid var(--saffron)" : "4px solid transparent",
                      }}
                    >
                      <Icon size={20} style={{ flexShrink: 0 }} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Drawer Footer */}
              <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={toggleTheme}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px", borderRadius: "8px", width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
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
        )}
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
              className="rider-hamburger-btn"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            <h2
              style={{
                fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              👋 Hey, {user?.name?.split(" ")[0] || "Rider"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <div
              style={{
                padding: "4px 10px",
                borderRadius: "20px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.2)",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#10b981",
              }}
            >
              🟢 Online
            </div>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              R
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "clamp(12px, 2.5vw, 24px)", overflowY: "auto", minWidth: 0, width: "100%" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
