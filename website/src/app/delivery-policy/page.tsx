import React from "react";

export default function DeliveryPolicyPage() {
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2rem", fontWeight: 900, marginBottom: "24px", color: "var(--text-primary)" }}>
          Delivery Policy
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "30px" }}>
          Last updated: July 9, 2026
        </p>

        <div className="card" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px", lineHeight: 1.7, fontSize: "0.95rem" }}>
          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>1. Delivery Radius & Area</h2>
            <p>
              We deliver strictly within a <strong>2.2 km radius</strong> of the Karachi Naseeb Baryani UCP Branch. This includes UCP Campus, Johar Town Block C, and parts of adjoining areas. The system uses Google Maps coordinate distance checks to prevent order entry from outside this delivery zone.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>2. Delivery Timings</h2>
            <p>
              Deliveries are dispatched during operational hours: <strong>11:00 AM – 11:00 PM</strong>. Average delivery times range from 20 to 35 minutes depending on order volume and traffic. Heavy rain or peak lunch/dinner rush hours might cause temporary delays.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>3. Charges Structure</h2>
            <p>
              We charge a flat base delivery fee of <strong>Rs. 50</strong> for orders within 1 km, and an additional distance fee as defined in our delivery settings. Free delivery may apply during promotional periods or for orders exceeding a minimum checkout amount.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.2rem", color: "var(--maroon)", marginBottom: "10px" }}>4. Rider Safety</h2>
            <p>
              Our deliveries are handled by dedicated in-house staff. In case of extreme weather conditions or road closures, delivery times may be adjusted or temporarily suspended to ensure team safety.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
