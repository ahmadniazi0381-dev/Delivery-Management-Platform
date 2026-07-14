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
      a: "We accept Cash on Delivery (COD), Direct Bank Transfer, JazzCash, Easypaisa, and Credit/Debit Cards. For bank transfers, you must enter your transaction reference number on checkout for manual confirmation."
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
          <div className="section-tag" style={{ display: "inline-block" }}>❓ Support Help</div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.25rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "12px" }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "8px" }}>
            Got questions? We have answers. Find general information about orders and delivery here.
          </p>
        </div>

        {/* FAQ list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {faqs.map((faq, i) => {
            const isOpen = activeIndex === i;
            return (
              <div
                key={i}
                className="card"
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  border: isOpen ? "1.5px solid var(--saffron)" : "1px solid var(--border-color)"
                }}
                onClick={() => toggleAccordion(i)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                    {faq.q}
                  </strong>
                  <span style={{ fontSize: "1.1rem", color: "var(--saffron)", transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
                    +
                  </span>
                </div>
                
                {isOpen && (
                  <p style={{
                    marginTop: "14px",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "12px",
                    animation: "fadeIn 0.25s ease-out"
                  }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
