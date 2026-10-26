"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/track", label: "Track Order" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const pathname = usePathname();

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b backdrop-blur-xl ${
          scrolled
            ? "bg-[rgba(255,255,255,0.95)] dark:bg-[rgba(18,10,6,0.95)] shadow-[0_4px_24px_rgba(124,45,18,0.10)] border-[rgba(124,45,18,0.12)]"
            : "bg-[rgba(255,255,255,0.90)] dark:bg-[rgba(26,14,8,0.90)] border-[rgba(124,45,18,0.08)] shadow-[0_2px_12px_rgba(124,45,18,0.04)]"
        }`}
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          {/* Logo with Link */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 no-underline shrink-0 group"
            aria-label="Delivery Platform Home"
          >
            <Logo
              size={38}
              className="shadow-saffron group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col leading-tight overflow-hidden">
              <span
                className="font-[Poppins] font-extrabold text-xs sm:text-base tracking-tight whitespace-nowrap"
                style={{ color: "var(--text-primary)" }}
              >
                Delivery Platform
              </span>
              <span
                className="font-[Poppins] font-semibold text-[0.6rem] sm:text-[0.68rem] uppercase tracking-[0.16em] whitespace-nowrap"
                style={{ color: "var(--burnt-orange)" }}
              >
                Order Fresh Food
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-[#EA580C] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[#EA580C]"
                }`}
              >
                {isActive(link.href) && (
                  <span
                    className="absolute inset-0 rounded-full -z-10"
                    style={{
                      background: "rgba(234, 88, 12, 0.12)",
                      boxShadow: "inset 0 0 0 1px rgba(234,88,12,0.15)",
                    }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Clickable Call Phone Link (Desktop XL) */}
            <a
              href="tel:+923054311118"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105 border"
              style={{
                borderColor: "rgba(234, 88, 12, 0.25)",
                color: "#EA580C",
                background: "rgba(234, 88, 12, 0.06)",
              }}
              title="Call for orders & inquiry"
            >
              <span>📞</span>
              <span>0305 4311118</span>
            </a>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-full hover:bg-[color:var(--border-subtle)] transition-colors relative w-9 h-9 flex items-center justify-center overflow-hidden"
              aria-label="Toggle dark mode"
              aria-pressed={darkMode}
            >
              <span
                className={`absolute transition-all duration-500 ${
                  darkMode ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
                aria-hidden
              >
                ☀️
              </span>
              <span
                className={`absolute transition-all duration-500 ${
                  darkMode ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
                aria-hidden
              >
                🌙
              </span>
            </button>

            {/* Cart Link with Badge */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-white font-semibold text-xs sm:text-sm transition-all no-underline shadow-saffron"
              style={{ background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)" }}
              aria-label={`Shopping Cart, ${cart.totalItems} items`}
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Cart</span>
              {cart.totalItems > 0 && (
                <span className="bg-red-600 text-white text-[0.65rem] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm">
                  {cart.totalItems}
                </span>
              )}
            </Link>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {user.role?.toUpperCase() === "ADMIN" && (
                  <Link
                    href="/dashboard"
                    className="hidden lg:block text-xs font-semibold px-2.5 py-1.5 rounded-full"
                    style={{
                      background: "rgba(234, 88, 12, 0.1)",
                      color: "var(--burnt-orange)",
                    }}
                  >
                    ⚙️ Dashboard
                  </Link>
                )}
                {user.role?.toUpperCase() === "RIDER" && (
                  <Link
                    href="/rider"
                    className="hidden lg:block text-xs font-semibold px-2.5 py-1.5 rounded-full"
                    style={{
                      background: "rgba(234, 88, 12, 0.1)",
                      color: "var(--burnt-orange)",
                    }}
                  >
                    🚴 Rider
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-inner transition-transform hover:scale-105"
                  title={user.name}
                  style={{
                    background: "linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden sm:inline-block px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors"
                style={{
                  color: "#EA580C",
                  background: "rgba(234,88,12,0.08)",
                }}
              >
                Login
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <div className="w-5 h-4 flex flex-col justify-between relative">
                <span
                  className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 ${
                    menuOpen ? "rotate-45 translate-y-[0.45rem]" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-current rounded-full transition-all duration-300 ${
                    menuOpen ? "-rotate-45 -translate-y-[0.45rem]" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown / Drawer Menu */}
        <div
          className={`lg:hidden absolute top-full left-0 right-0 mt-2 p-5 rounded-3xl backdrop-blur-2xl border shadow-2xl transition-all duration-300 overflow-hidden ${
            menuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto max-h-[85vh] overflow-y-auto"
              : "opacity-0 -translate-y-4 pointer-events-none max-h-0"
          }`}
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          {/* Quick Contact Bar on Mobile */}
          <div
            className="flex items-center justify-between gap-2 p-2.5 mb-4 rounded-2xl border text-xs"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <a
              href="tel:+923054311118"
              className="flex items-center gap-1.5 font-bold text-[#EA580C] no-underline"
            >
              <span>📞</span>
              <span>0305 4311118</span>
            </a>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a
              href="https://wa.me/923054311118?text=Hello%20Delivery%20Platform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-bold text-emerald-600 no-underline"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`p-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-between ${
                  isActive(link.href)
                    ? "bg-orange-500/10 text-[#EA580C]"
                    : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span>{link.label}</span>
                <span className="text-xs text-orange-400">➔</span>
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="p-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-between text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <span>🛒</span>
                <span>Cart</span>
              </span>
              <span className="bg-[#EA580C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.totalItems}
              </span>
            </Link>

            <div className="h-px bg-black/5 dark:bg-white/5 my-2" />

            {/* User Account / Navigation */}
            {!user ? (
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="w-full p-3.5 rounded-2xl font-bold text-center text-white text-sm"
                style={{
                  background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                }}
              >
                Login / Register
              </Link>
            ) : (
              <div className="flex flex-col gap-1.5">
                {user.role?.toUpperCase() === "ADMIN" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-2xl font-semibold text-sm bg-orange-500/10 text-[#EA580C]"
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                {user.role?.toUpperCase() === "RIDER" && (
                  <Link
                    href="/rider"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-2xl font-semibold text-sm bg-orange-500/10 text-[#EA580C]"
                  >
                    🚴 Rider Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-2xl font-medium text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  👤 My Profile ({user.name})
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 rounded-2xl font-medium text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  📦 My Order History
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full mt-2 p-3 rounded-2xl font-semibold text-sm text-red-600 bg-red-50 dark:bg-red-500/10 text-center"
                >
                  🚪 Logout Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
