import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for ordering from Delivery Platform. Review account registration, delivery conditions, and order policies.",
};

export default function TermsPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "92vh" }}>
      <div style={{ background: "var(--bg-secondary)", padding: "60px 20px 40px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h1 className="section-title" style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.5rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-primary)", lineHeight: 1.2 }}>
            Terms & Conditions
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 500 }}>
            Last updated: July 9, 2026
          </p>
        </div>
      </div>
      
      <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, fontSize: "1rem", background: "var(--bg-card)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>1.</span> Account Registration
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              By creating an account on Delivery Platform, you agree to provide accurate and current information. You are responsible for keeping your login credentials secure. Phone verification is mandatory to complete checkout.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>2.</span> Delivery Conditions
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              We deliver exclusively within our marked delivery zone (2.2 km radius from the UCP branch). If an address is found to be incorrectly placed or falsified outside this zone, we reserve the right to cancel the order.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>3.</span> Order Cancellation & Refunds
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              Orders can only be cancelled before they are accepted and marked as "Preparing" by the restaurant. Once preparation starts, cancellations cannot be made. For prepaid orders that are rejected or cancelled under eligible circumstances, refund processing will be initiated within 3-5 business days.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.3rem", color: "#9A3412", marginBottom: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#EA580C" }}>4.</span> Modification of Services
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>
              The restaurant reserves the right to change menu prices, items availability, delivery charges, and minimum order requirements at any time without prior notice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
