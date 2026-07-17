"use client";

import React, { useState } from "react";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQPage() {
  const faqs: FAQItem[] = [
    {
      q: "What is your delivery service area?",
      a: "We deliver exclusively within a 2.2 km radius from our UCP (University of Central Punjab) branch in Johar Town, Lahore. This ensures that the biryani reaches your location steaming hot in under 30 minutes. If your coordinates are outside this area, our website will block checkout."
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
      a: "Our Karachi Special Biryani is cooked in authentic, mildly hot spices typical of street-style biryani. We mark spicy items on our menu with a 🌶️ icon. Because biryani and pulao are cooked in large batches (Deegs), we cannot adjust individual spice levels per plate, but you can select optional side raitas to balance the spice."
    },
    {
      q: "Are you affiliated with Foodpanda?",
      a: "No! We operate as a single-branch independent restaurant and manage our own direct delivery riders. This allows us to maintain strict quality control and eliminate third-party service fees."
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
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-tag" style={{ display: "inline-flex" }}>❓ Support Help</div>
          <h1 style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 900,
            color: "var(--text-primary)",
            marginTop: "12px"
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem", marginTop: "8px", maxWidth: "560px", margin: "8px auto 0" }}>
            Got questions? We have answers. Find general information about orders and delivery here.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} role="list">
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
                  border: isOpen ? "1.5px solid var(--saffron)" : "1px solid var(--border-color)",
                  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                  boxShadow: isOpen ? "var(--shadow-saffron)" : "var(--shadow-card)",
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
                    padding: "20px 24px",
                    textAlign: "left",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <span style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                  }}>
                    {faq.q}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: "1.1rem",
                      color: "var(--saffron)",
                      transform: isOpen ? "rotate(45deg)" : "none",
                      transition: "transform var(--transition-base)",
                      flexShrink: 0,
                      fontWeight: 700,
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
                    padding: isOpen ? "0 24px 20px" : "0 24px",
                    maxHeight: isOpen ? "600px" : "0",
                    overflow: "hidden",
                    transition: "max-height var(--transition-slow)",
                  }}
                >
                  <div
                    style={{
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "16px",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
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
          marginTop: "48px",
          padding: "32px 24px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
        }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Still have questions?
          </p>
          <a
            href="/contact"
            className="btn btn-primary"
            style={{ display: "inline-flex" }}
          >
            Contact Us
          </a>
        </div>

      </div>
    </div>
  );
}
