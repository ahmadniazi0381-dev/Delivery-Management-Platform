import React from "react";

export default function TermsPage() {
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2rem", fontWeight: 900, marginBottom: "24px", color: "var(--text-primary)" }}>
          Terms & Conditions
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "30px" }}>
          Last updated: July 9, 2026
        </p>

        <div className="card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px", lineHeight: 1.7, fontSize: "0.95rem" }}>
          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>1. Account Registration</h2>
            <p>
              By creating an account on Naseeb Baryani UCP ordering platform, you agree to provide accurate and current information. You are responsible for keeping your login credentials secure. Phone verification is mandatory to complete checkout.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>2. Delivery Conditions</h2>
            <p>
              We deliver exclusively within our marked delivery zone (2.2 km radius from the UCP branch). If an address is found to be incorrectly placed or falsified outside this zone, we reserve the right to cancel the order.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>3. Order Cancellation & Refunds</h2>
            <p>
              Orders can only be cancelled before they are accepted and marked as "Preparing" by the restaurant. Once preparation starts, cancellations cannot be made. For prepaid orders that are rejected or cancelled under eligible circumstances, refund processing will be initiated within 3-5 business days.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>4. Modification of Services</h2>
            <p>
              The restaurant reserves the right to change menu prices, items availability, delivery charges, and minimum order requirements at any time without prior notice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
