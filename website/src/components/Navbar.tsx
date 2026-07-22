"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/track", label: "Track Order" },
];

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [darkMode, setDarkMode]       = useState(false);
  const { cart }                       = useCart();
  const { user, logout }               = useAuth();
  const pathname                       = usePathname();

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Dark mode toggle
  useEffect(() => {
    const stored = localStorage.getItem("naseeb_theme");
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDarkMode(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("naseeb_theme", next ? "dark" : "light");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav
        className={`nav ${scrolled ? "nav-scrolled" : ""}`}
        style={{ transition: "all 0.3s ease" }}
      >
        <div
          className="container"
          style={{
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(8px, 2vw, 24px)",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 1.5vw, 10px)",
              textDecoration: "none",
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <LogoMark size={40} />
            <div style={{ lineHeight: 1.1, minWidth: 0 }} className="nav-logo-text">
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                  color: "var(--maroon)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Naseeb Baryani
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "clamp(0.6rem, 1.5vw, 0.7rem)",
                  color: "var(--saffron)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                &amp; Pulao · UCP
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div
            className="hide-mobile"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontWeight: isActive(link.href) ? 600 : 500,
                  fontSize: "0.9rem",
                  color: isActive(link.href)
                    ? "var(--saffron)"
                    : "var(--text-secondary)",
                  background: isActive(link.href)
                    ? "rgba(217, 119, 6, 0.1)"
                    : "transparent",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="btn btn-ghost btn-icon"
              style={{ fontSize: "1.1rem", padding: "8px" }}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* Cart Button */}
            <Link
              href="/cart"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "99px",
                background: "var(--grad-saffron)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                boxShadow: "var(--shadow-saffron)",
                transition: "all 0.2s ease",
                textDecoration: "none",
              }}
            >
              <span>🛒</span>
              <span className="hide-mobile">Cart</span>
              {cart.totalItems > 0 && (
                <span
                  style={{
                    background: "var(--maroon)",
                    color: "#fff",
                    borderRadius: "99px",
                    padding: "1px 7px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    minWidth: "20px",
                    textAlign: "center",
                    animation: "badge-pulse 2s ease-in-out infinite",
                  }}
                >
                  {cart.totalItems}
                </span>
              )}
            </Link>

            {/* Auth Button */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {user.role?.toUpperCase() === "ADMIN" && (
                  <Link
                    href="/dashboard"
                    className="btn btn-sm btn-ghost hide-mobile"
                    style={{ textDecoration: "none", color: "var(--saffron)", fontWeight: 600 }}
                  >
                    ⚙️ Dashboard
                  </Link>
                )}
                {user.role?.toUpperCase() === "RIDER" && (
                  <Link
                    href="/rider"
                    className="btn btn-sm btn-ghost hide-mobile"
                    style={{ textDecoration: "none", color: "var(--saffron)", fontWeight: 600 }}
                  >
                    🚴 Rider Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--grad-maroon)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="btn btn-ghost btn-sm hide-mobile"
                style={{ textDecoration: "none" }}
              >
                Login
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="show-mobile"
              style={{
                fontSize: "1.4rem",
                padding: "4px",
                color: "var(--text-primary)",
                background: "none",
                border: "none",
              }}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            style={{
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border-color)",
              padding: "16px 20px 20px",
              animation: "fadeUp 0.2s ease-out",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  color: isActive(link.href)
                    ? "var(--saffron)"
                    : "var(--text-secondary)",
                  background: isActive(link.href)
                    ? "rgba(217, 119, 6, 0.08)"
                    : "transparent",
                  marginBottom: "4px",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  marginTop: "8px",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  color: "var(--saffron)",
                  border: "1.5px solid var(--saffron)",
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Login / Register
              </Link>
            )}
            {user && (
              <>
                {user.role?.toUpperCase() === "ADMIN" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      color: 'var(--saffron)',
                      background: 'rgba(217, 119, 6, 0.08)',
                      marginBottom: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                {user.role?.toUpperCase() === "RIDER" && (
                  <Link
                    href="/rider"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      color: 'var(--saffron)',
                      background: 'rgba(217, 119, 6, 0.08)',
                      marginBottom: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    🚴 Rider Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    marginBottom: '4px',
                    textDecoration: 'none',
                  }}
                >
                  👤 Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'block', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontWeight: 500, color: 'var(--text-secondary)', background: 'transparent', marginBottom: '4px', textDecoration: 'none' }}
                >
                  📦 My Orders
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 600,
                    color: "#EF4444",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Mobile/Desktop CSS helpers */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}

// ── Inline Logo Mark (Next Image) ────────────────────────────
function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Karachi Naseeb Baryani logo"
      width={size}
      height={size}
      priority
      style={{
        borderRadius: "50%",
        border: "1.5px solid var(--saffron, #D97706)",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}
