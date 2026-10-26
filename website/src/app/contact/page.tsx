"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setPhone("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+923054311118");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "92vh" }}>
      <div style={{ background: "var(--bg-secondary)", padding: "60px 20px 40px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ display: "inline-block", color: "#C2410C", background: "#FFF4E8", padding: "6px 12px", borderRadius: "var(--radius-full)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "12px" }}>📞 Contact Us</div>
          <h1 className="section-title" style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.5rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "12px", lineHeight: 1.2 }}>
            Get in Touch
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "16px", lineHeight: 1.6, maxWidth: "600px", margin: "16px auto 0" }}>
            Questions, feedback, or party catering orders? We are here to help!
          </p>
        </div>
      </div>

      <div style={{ padding: "40px 20px 60px", maxWidth: "900px", margin: "0 auto" }}>
        {submitted && (
          <div style={{ background: "#FFF4E8", border: "1px solid #F59E0B", color: "#9A3412", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "32px", textAlign: "center", fontSize: "0.95rem", fontWeight: 500 }}>
            🎉 Message received successfully! Our shop manager will call you back shortly.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "32px" }} className="contact-layout">
          
          {/* Info Side */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="card" style={{ padding: "28px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius-xl)" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#9A3412", marginBottom: "14px", fontWeight: 700 }}>
                📍 Location
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Delivery Platform,<br />
                Shop #15, Near UCP, Khayaban-e-Jinnah,<br />
                Johar Town, Lahore, Pakistan.
              </p>
              <a
                href="https://www.google.com/maps/place/Karachi+Naseeb+Biryani+And+Pulao+ucp/@31.4475531,74.2690347,17z"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  fontSize: "0.9rem",
                  color: "#EA580C",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "#C2410C"}
                onMouseOut={(e) => e.currentTarget.style.color = "#EA580C"}
              >
                🗺️ Open in Google Maps ➔
              </a>
            </div>

            <div className="card" style={{ padding: "28px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius-xl)" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#9A3412", marginBottom: "10px", fontWeight: 700 }}>
                📞 Restaurant Owner &amp; Support
              </h3>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                Muhammad Abdullah
              </p>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Phone &amp; WhatsApp: <a href="tel:+923054311118" style={{ color: "#EA580C", fontWeight: 700, textDecoration: "none" }}>+92 305 4311118</a>
              </p>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Email: <a href="mailto:info@deliveryplatform.com" style={{ color: "#EA580C", fontWeight: 600, textDecoration: "none" }}>info@deliveryplatform.com</a>
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <a
                  href="tel:+923054311118"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "#9A3412",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  📞 Call
                </a>

                <a
                  href="https://wa.me/923054311118?text=Hello%20Muhammad%20Abdullah%2C%20I%20would%20like%20to%20place%20an%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "#F59E0B",
                    color: "#000000",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  💬 WhatsApp
                </a>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    background: copied ? "rgba(22, 163, 74, 0.1)" : "var(--bg-primary)",
                    color: copied ? "#15803D" : "var(--text-primary)",
                    borderColor: copied ? "#16A34A" : "var(--border-subtle)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: "28px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--radius-xl)" }}>
              <h3 style={{ fontSize: "1.2rem", color: "#9A3412", marginBottom: "14px", fontWeight: 700 }}>
                ⏰ Working Hours
              </h3>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Monday – Sunday: <strong style={{ color: "var(--text-primary)" }}>11:00 AM – 11:00 PM</strong><br />
                Open on public holidays.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="card" style={{ padding: "32px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)", borderRadius: "var(--radius-xl)" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "24px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
              Send a Message
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="input-group" style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0 12px" }}>
                <span className="input-icon" style={{ fontSize: "1.1rem", opacity: 0.7 }}>👤</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ border: "none", background: "transparent", padding: "12px", width: "100%", outline: "none", color: "var(--text-primary)" }}
                />
              </div>
              <div className="input-group" style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0 12px" }}>
                <span className="input-icon" style={{ fontSize: "1.1rem", opacity: 0.7 }}>📞</span>
                <input
                  type="tel"
                  className="input"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ border: "none", background: "transparent", padding: "12px", width: "100%", outline: "none", color: "var(--text-primary)" }}
                />
              </div>
              <div className="input-group" style={{ display: "flex", alignItems: "flex-start", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                <span className="input-icon" style={{ fontSize: "1.1rem", opacity: 0.7, marginTop: "2px" }}>✉️</span>
                <textarea
                  className="input"
                  placeholder="Type your message or inquiry here..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ border: "none", background: "transparent", padding: "0 0 0 12px", width: "100%", outline: "none", resize: "none", color: "var(--text-primary)", fontFamily: "inherit" }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1.05rem", fontWeight: 700, borderRadius: "var(--radius-full)", background: "linear-gradient(135deg, #EA580C, #C2410C)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "var(--shadow-sm)", marginTop: "8px" }}>
                Send Message ➔
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
