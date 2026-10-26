"use client";

import React, { useState } from "react";
import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQPage() {
  const faqs: FAQItem[] = [
    {
      q: "What is your delivery service area?",
      a: "We deliver within our configured delivery radius. This ensures that food reaches your location steaming hot in under 30 minutes. If your coordinates are outside our service area, our website will block checkout."
    },
    {
      q: "How do you verify my address coordinates?",
      a: "We use Google Maps API geocoding. During checkout, you can click '📍 Get Current Geolocation' to fetch your exact coordinates from your browser/device GPS, or enter the location details. Our server checks straight-line distance using the Haversine formula."
    },
    {
      q: "Do you have phone verification?",
      a: "Yes! To prevent fake orders, first-time customers must verify their phone number via a 6-digit OTP (SMS code) before placing their first order. Once verified, subsequent orders do not require OTP."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Cash on Delivery (COD), JazzCash, Easypaisa, and Credit/Debit Cards. All digital payments are processed securely before your order is confirmed."
    },
    {
      q: "Can I cancel my order?",
      a: "You can cancel your order from the order tracking screen ONLY if the restaurant has not yet accepted it (status is PENDING). Once the restaurant accepts the order, preparation starts and cancellation is no longer permitted."
    },
    {
      q: "Is your food spicy? Can I customize the spice level?",
      a: "We mark spicy items on our menu with a 🌶️ icon so you can choose according to your preference."
    },
    {
      q: "How do deliveries work?",
      a: "We manage direct delivery riders. This allows us to maintain strict quality control and ensure fast, reliable delivery without third-party delay."
    },
    {
      q: "How can I track my order live?",
      a: "When you place an order, you are redirected to the tracking page. The timeline updates in real-time as the status changes: Pending → Accepted → Preparing → Ready → Out for Delivery → Delivered. Sockets ensure updates push instantly."
    }
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "92vh" }}>
      <div style={{ background: "var(--bg-secondary)", padding: "60px 20px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ display: "inline-block", color: "#C2410C", background: "#FFF4E8", padding: "6px 12px", borderRadius: "var(--radius-full)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "12px" }}>❓ Support Help</div>
          <h1 className="section-title" style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "var(--text-primary)", marginTop: "12px", lineHeight: 1.2 }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "16px", lineHeight: 1.6, maxWidth: "600px", margin: "16px auto 0" }}>
            Got questions? We have answers. Find general information about orders and delivery here.
          </p>
        </div>
      </div>

      <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
        {/* FAQ Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} role="list">
          {faqs.map((faq, i) => {
            const isOpen = activeIndex === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <div
                key={i}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: isOpen ? "1.5px solid #EA580C" : "1px solid var(--border-subtle)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: isOpen ? "0 4px 12px rgba(234, 88, 12, 0.15)" : "var(--shadow-sm)",
                }}
                role="listitem"
              >
                <button
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleAccordion(i)}
                  style={{
                    width: "100%",
                    padding: "24px",
                    textAlign: "left",
                    background: isOpen ? "#FFF4E8" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    border: "none",
                    outline: "none",
                    transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: isOpen ? "#C2410C" : "var(--text-primary)",
                    lineHeight: 1.5,
                    transition: "color 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}>
                    {faq.q}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: "1.5rem",
                      color: isOpen ? "#EA580C" : "var(--text-muted)",
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      flexShrink: 0,
                      fontWeight: 400,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  style={{
                    padding: isOpen ? "0 24px 24px" : "0 24px",
                    maxHeight: isOpen ? "600px" : "0",
                    overflow: "hidden",
                    opacity: isOpen ? 1 : 0,
                    background: isOpen ? "#FFF4E8" : "transparent",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div
                    style={{
                      borderTop: "1px solid rgba(234, 88, 12, 0.2)",
                      paddingTop: "20px",
                      color: "var(--text-secondary)",
                      fontSize: "0.95rem",
                      lineHeight: 1.75,
                    }}
                  >
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: "center",
          marginTop: "60px",
          padding: "40px 24px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)"
        }}>
          <p style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)", marginBottom: "16px" }}>
            Still have questions?
          </p>
          <Link
            href="/contact"
            className="btn btn-primary"
            style={{ 
              display: "inline-flex", 
              padding: "12px 32px", 
              fontSize: "1.05rem", 
              fontWeight: 700, 
              borderRadius: "var(--radius-full)", 
              background: "linear-gradient(135deg, #EA580C, #C2410C)", 
              color: "#fff", 
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            Contact Us
          </Link>
        </div>

      </div>
    </div>
  );
}
