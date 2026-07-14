import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2rem", fontWeight: 900, marginBottom: "24px", color: "var(--text-primary)" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "30px" }}>
          Last updated: July 9, 2026
        </p>

        <div className="card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px", lineHeight: 1.7, fontSize: "0.95rem" }}>
          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when creating an account, saving an address, or placing an order. This includes your name, email address, mobile phone number, exact GPS coordinates (latitude and longitude) of your saved addresses, and order history.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>2. How We Use Your Information</h2>
            <p>
              We use your information to process and deliver your orders, send you OTP codes for phone number verification, calculate delivery distance eligibility, process your payments, notify you about order status updates, and improve our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>3. Location Data</h2>
            <p>
              To confirm that your delivery address is within our 2.2 km delivery range, we calculate your straight-line distance from our UCP branch. This location data is saved in our database associated with your account profile so that you can reuse saved addresses.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>4. Security of Data</h2>
            <p>
              We implement industry-standard security measures including bcrypt password hashing, JWT authorization, database access controls, and HTTPS connections to keep your data safe. We never sell your personal information to third parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
