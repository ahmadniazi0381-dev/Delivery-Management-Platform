import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "60px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-tag" style={{ display: "inline-block" }}>🍛 Our Story</div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "2.25rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "12px" }}>
            Karachi Naseeb Baryani & Pulao
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "8px" }}>
            Serving authentic street flavors right next to UCP Lahore campus!
          </p>
        </div>

        {/* Narrative Card */}
        <div className="card" style={{ padding: "36px", marginBottom: "32px", lineHeight: 1.8 }}>
          <h2 style={{ fontSize: "1.35rem", marginBottom: "16px", color: "var(--maroon)" }}>
            Established in 1998 — A Legacy of Taste
          </h2>
          <p style={{ marginBottom: "16px" }}>
            Originally born in the bustling streets of Karachi, Naseeb Baryani was founded with a single mission: to serve the most authentic, aromatic, and spicy beef biryani made with long-grain basmati rice, real saffron, and our proprietary spice mix.
          </p>
          <p style={{ marginBottom: "16px" }}>
            Our UCP Branch in Johar Town, Lahore is our first campus-dedicated branch. We cook fresh batches daily in traditional clay copper pots (Deegs) right on-site, ensuring that the food is steaming hot when it reaches your plate. Whether you love the classic fiery red spices of our special biryani or the rich, meat-infused stock of our traditional pulao, we bring the true taste of Karachi straight to Lahore.
          </p>
          <p>
            Unlike delivery-app networks, we employ our own dispatch staff, delivering within a strict <strong>2.2 km radius</strong> of the campus to guarantee that your food arrives hot, fresh, and on time.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          {[
            { value: "Daily", label: "Fresh Batches" },
            { value: "30 Mins", label: "Average Delivery" },
            { value: "2.2 KM", label: "Fixed Service Area" },
            { value: "100%", label: "Halal & Hygienic" }
          ].map((stat, i) => (
            <div key={i} className="card" style={{ padding: "20px", textAlign: "center", background: "var(--grad-card)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--saffron-dark)" }}>{stat.value}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: "center" }}>
          <Link href="/menu">
            <button className="btn btn-primary" style={{ padding: "12px 36px", fontSize: "1rem" }}>
              Order Online Now 🍛
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
