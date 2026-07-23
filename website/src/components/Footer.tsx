"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--maroon)",
        color: "#FEF3C7",
        marginTop: "auto",
      }}
    >
      {/* Top Section */}
      <div
        className="container"
        style={{
          padding: "56px 20px 40px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "40px",
        }}
      >
        {/* Brand Column */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1.5px solid #F59E0B",
                objectFit: "cover",
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "#F59E0B",
                }}
              >
                Naseeb Baryani
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                & Pulao · UCP Branch
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.9rem",
              lineHeight: 1.7,
              opacity: 0.75,
              marginBottom: "20px",
            }}
          >
            Authentic Karachi flavors brought to Lahore. Fresh, fragrant, and
            made with love — delivered fast to your doorstep.
          </p>
          {/* Social */}
          <div style={{ display: "flex", gap: "10px" }}>
            {["📘", "📸", "🐦"].map((icon, i) => (
              <div
                key={i}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(254, 243, 199, 0.1)",
                  border: "1px solid rgba(254, 243, 199, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#F59E0B",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Quick Links
          </h4>
          {[
            { href: "/", label: "Home" },
            { href: "/menu", label: "Full Menu" },
            { href: "/cart", label: "My Cart" },
            { href: "/track", label: "Track Order" },
            { href: "/auth/login", label: "Login / Register" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "block",
                padding: "6px 0",
                fontSize: "0.9rem",
                color: "rgba(254, 243, 199, 0.75)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "#F59E0B")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color =
                  "rgba(254, 243, 199, 0.75)")
              }
            >
              → {link.label}
            </Link>
          ))}
        </div>

        {/* Contact & Location */}
        <div>
          <h4
            style={{
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#F59E0B",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Contact Us
          </h4>
          {[
            { icon: "👤", text: "Owner: Muhammad Abdullah" },
            { icon: "📞", text: "+92 305 4311118", href: "tel:+923054311118" },
            { icon: "💬", text: "WhatsApp: +92 305 4311118", href: "https://wa.me/923054311118?text=Hello%20Muhammad%20Abdullah%2C%20I%20would%20like%20to%20place%20an%20order." },
            { icon: "📍", text: "Near UCP Campus, Lahore" },
            { icon: "🕐", text: "Open 11:00 AM – 11:00 PM" },
            { icon: "🛵", text: "Delivery within 2.2km radius" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "10px",
                padding: "6px 0",
                fontSize: "0.875rem",
                color: "rgba(254, 243, 199, 0.75)",
                alignItems: "flex-start",
              }}
            >
              <span style={{ flexShrink: 0, marginTop: "1px" }}>
                {item.icon}
              </span>
              {'href' in item && item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? "_blank" : undefined}
                  rel={item.href.startsWith('http') ? "noopener noreferrer" : undefined}
                  style={{ color: "rgba(254, 243, 199, 0.9)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F59E0B")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(254, 243, 199, 0.9)")}
                >
                  {item.text}
                </a>
              ) : (
                <span>{item.text}</span>
              )}
            </div>
          ))}

          {/* Google Maps Link */}
          <a
            href="https://www.google.com/maps/place/Karachi+Naseeb+Biryani+And+Pulao+ucp/@31.4474776,74.2690795,21z"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "12px",
              padding: "8px 14px",
              borderRadius: "8px",
              background: "rgba(254, 243, 199, 0.1)",
              border: "1px solid rgba(254, 243, 199, 0.2)",
              color: "#F59E0B",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            📌 View on Google Maps
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: "1px solid rgba(254, 243, 199, 0.1)",
          padding: "16px 20px",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "rgba(254, 243, 199, 0.5)",
        }}
      >
        <div className="container">
          © {new Date().getFullYear()} Karachi Naseeb Baryani & Pulao — UCP
          Branch. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
