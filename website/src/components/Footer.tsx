"use client";

import React, { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setNewsletterStatus("error");
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }

    setNewsletterStatus("success");
    setNewsletterMessage("🎉 Thank you for subscribing! Check your inbox for exclusive deals.");
    setEmail("");
    setTimeout(() => {
      setNewsletterStatus("idle");
      setNewsletterMessage("");
    }, 6000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto relative z-10 border-t"
      style={{
        background: "var(--grad-subtle)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="container mx-auto px-6 pt-16 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        {/* Column 1: Brand & About */}
        <div className="flex flex-col gap-5">
          <Link
            href="/"
            className="flex items-center gap-3 no-underline group w-fit"
            aria-label="Delivery Platform Home"
          >
            <Logo size={42} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span
                className="font-[Poppins] font-extrabold text-base tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Delivery Platform
              </span>
              <span
                className="text-[0.68rem] tracking-[0.2em] uppercase font-semibold"
                style={{ color: "var(--burnt-orange)" }}
              >
                Order Fresh Food
              </span>
            </div>
          </Link>

          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Delicious food and slow-cooked meals prepared fresh daily. Delivered hot straight to your doorstep in 30 minutes.
          </p>

          {/* Social Links */}
          <div className="flex gap-3 items-center">
            {[
              {
                icon: "📘",
                label: "Facebook",
                href: "https://facebook.com/deliveryplatform",
              },
              {
                icon: "📸",
                label: "Instagram",
                href: "https://instagram.com/deliveryplatform",
              },
              {
                icon: "💬",
                label: "WhatsApp",
                href: "https://wa.me/923054311118?text=Hello%20Delivery%20Platform%2C%20I%20would%20like%20to%20order",
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300 border hover:scale-110"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <span>{social.icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4
            className="text-xs tracking-[0.18em] uppercase font-bold mb-5"
            style={{ color: "#EA580C" }}
          >
            Quick Links
          </h4>
          <div className="flex flex-col gap-3">
            {[
              { href: "/", label: "Home" },
              { href: "/menu", label: "Explore Menu" },
              { href: "/about", label: "About Us" },
              { href: "/contact", label: "Contact Us" },
              { href: "/track", label: "Track Your Order" },
              { href: "/cart", label: "My Cart" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-all duration-200 w-fit flex items-center gap-2 group"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EA580C";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span className="text-xs transition-opacity duration-200 text-orange-500">
                  ›
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3: Help & Policies */}
        <div>
          <h4
            className="text-xs tracking-[0.18em] uppercase font-bold mb-5"
            style={{ color: "#EA580C" }}
          >
            Help &amp; Policies
          </h4>
          <div className="flex flex-col gap-3">
            {[
              { href: "/faq", label: "Frequently Asked Questions" },
              { href: "/delivery-policy", label: "Delivery Policy" },
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/auth/login", label: "Customer Login" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-all duration-200 w-fit flex items-center gap-2 group"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EA580C";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span className="text-xs transition-opacity duration-200 text-orange-500">
                  ›
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 4: Contact & Newsletter */}
        <div className="flex flex-col gap-4">
          <h4
            className="text-xs tracking-[0.18em] uppercase font-bold mb-1"
            style={{ color: "#EA580C" }}
          >
            Get In Touch
          </h4>

          <div className="flex flex-col gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex gap-2.5 items-center">
              <span>📞</span>
              <a
                href="tel:+923054311118"
                className="font-semibold transition-colors duration-200 hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                +92 305 4311118
              </a>
            </div>

            <div className="flex gap-2.5 items-center">
              <span>💬</span>
              <a
                href="https://wa.me/923054311118?text=Hello%20Support%2C%20I%20am%20inquiring%20about%20my%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                WhatsApp: 0305 4311118
              </a>
            </div>

            <div className="flex gap-2.5 items-center">
              <span>✉️</span>
              <a
                href="mailto:info@deliveryplatform.com"
                className="transition-colors duration-200 hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                info@deliveryplatform.com
              </a>
            </div>

            <div className="flex gap-2.5 items-start">
              <span className="mt-0.5">📍</span>
              <a
                href="https://www.google.com/maps/place/Karachi+Naseeb+Biryani+And+Pulao+ucp/@31.4475531,74.2690347,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Shop #15, Near UCP, Khayaban-e-Jinnah, Johar Town, Lahore
              </a>
            </div>

            <div className="flex gap-2.5 items-center text-xs" style={{ color: "var(--text-muted)" }}>
              <span>⏰</span>
              <span>Open Daily: 11:00 AM – 11:00 PM</span>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="mt-2 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Special Deals &amp; Discounts
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div
                className="flex items-center p-1 rounded-xl"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-3 py-1.5 text-xs w-full focus:outline-none bg-transparent"
                  style={{ color: "var(--text-primary)" }}
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                    color: "#fff",
                  }}
                >
                  Join
                </button>
              </div>

              {newsletterStatus === "error" && (
                <p className="text-xs text-red-600 font-medium animate-fade-in">
                  ⚠️ {newsletterMessage}
                </p>
              )}
              {newsletterStatus === "success" && (
                <p className="text-xs text-green-700 font-medium animate-fade-in">
                  {newsletterMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © {currentYear} Delivery Platform. All rights reserved.
          </span>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/delivery-policy" className="hover:underline">
              Delivery Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
