"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setPhone("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-tag" style={{ display: "inline-block" }}>📞 Contact Us</div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.25rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "12px" }}>
            Get in Touch
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "8px" }}>
            Questions, feedback, or party catering orders? We are here to help!
          </p>
        </div>

        {submitted && (
          <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "var(--success)", padding: "14px", borderRadius: "var(--radius-md)", marginBottom: "24px", textAlign: "center", fontSize: "0.95rem" }}>
            🎉 Message received successfully! Our shop manager will call you back shortly.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }} className="contact-layout">
          
          {/* Info Side */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--maroon)", marginBottom: "14px" }}>
                📍 Location
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Karachi Naseeb Baryani & Pulao,<br />
                Opposite UCP Main Gate, UCP Road,<br />
                Block C, Johar Town, Lahore, Pakistan.
              </p>
              <a
                href="https://www.google.com/maps/place/Karachi+Naseeb+Biryani+And+Pulao+ucp/@31.4475531,74.2690347,17z"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  fontSize: "0.85rem",
                  color: "var(--saffron)",
                  fontWeight: 600
                }}
              >
                🗺️ Open in Google Maps ➔
              </a>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--maroon)", marginBottom: "14px" }}>
                📞 Contact Numbers
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Shop Orders: <strong>+92 300 1234567</strong><br />
                Catering/Support: <strong>+92 300 0000000</strong>
              </p>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--maroon)", marginBottom: "14px" }}>
                ⏰ Working Hours
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Monday – Sunday: <strong>11:00 AM – 11:00 PM</strong><br />
                Open on public holidays.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="card" style={{ padding: "30px" }}>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              Send a Message
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <span className="input-icon">📞</span>
                <input
                  type="tel"
                  className="input"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ alignItems: "flex-start" }}>
                <span className="input-icon" style={{ marginTop: "12px" }}>✉️</span>
                <textarea
                  className="input"
                  placeholder="Type your message or inquiry here..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ resize: "none", padding: "12px 14px", height: "auto" }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>
                Send Message ➔
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
