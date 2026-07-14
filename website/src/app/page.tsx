"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MenuItem, MenuCategory } from "@/types";
import FoodCard from "@/components/FoodCard";

// ── Mock data (used when backend is offline for dev) ────────
const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 1, name: "Biryani",   emoji: "🍛", sortOrder: 1 },
  { id: 2, name: "Pulao",     emoji: "🍚", sortOrder: 2 },
  { id: 3, name: "Raita",     emoji: "🥛", sortOrder: 3 },
  { id: 4, name: "Drinks",    emoji: "🥤", sortOrder: 4 },
  { id: 5, name: "Extras",    emoji: "🍗", sortOrder: 5 },
];

const MOCK_ITEMS: MenuItem[] = [
  { id: 1, name: "Karachi Special Biryani", description: "The original Karachi-style beef biryani with fragrant basmati, saffron, and whole spices.", price: 380, categoryId: 1, isAvailable: true, isFeatured: true, isSpicy: true, preparationTime: 20 },
  { id: 2, name: "Chicken Biryani",         description: "Tender chicken pieces cooked with aromatic spices and layered with perfectly cooked rice.", price: 320, categoryId: 1, isAvailable: true, isFeatured: true, preparationTime: 18 },
  { id: 3, name: "Mutton Pulao",            description: "Slow-cooked mutton with whole spices, served with aromatic rice infused with the bone stock.", price: 420, categoryId: 2, isAvailable: true, isFeatured: true, isSpicy: false, preparationTime: 25 },
  { id: 4, name: "Chicken Pulao",           description: "Flavourful chicken pulao with a light, golden broth that elevates every grain of rice.", price: 290, categoryId: 2, isAvailable: true, preparationTime: 20 },
  { id: 5, name: "Dahi Raita",              description: "Fresh whipped yogurt with roasted cumin, mint, and a hint of red chilli.", price: 80, categoryId: 3, isAvailable: true, preparationTime: 5 },
  { id: 6, name: "Aloo Raita",              description: "Chunky potato raita with spiced yogurt — the perfect side for our biryani.", price: 90, categoryId: 3, isAvailable: true, preparationTime: 5 },
  { id: 7, name: "Lassi (Sweet)",           description: "Creamy, chilled sweet lassi made with fresh yogurt — a Pakistani classic.", price: 120, categoryId: 4, isAvailable: true, preparationTime: 3 },
  { id: 8, name: "Rooh Afza Drink",         description: "Refreshing chilled Rooh Afza with milk and a touch of rose water.", price: 100, categoryId: 4, isAvailable: true, preparationTime: 3 },
];

// ── Stats Data ──────────────────────────────────────────────
const STATS = [
  { value: "5,000+", label: "Happy Customers" },
  { value: "4.8★",   label: "Average Rating" },
  { value: "30min",  label: "Avg Delivery" },
  { value: "2.2km",  label: "Delivery Radius" },
];

// ── Why Choose Us ───────────────────────────────────────────
const FEATURES = [
  { icon: "🌿", title: "Fresh & Authentic", text: "Prepared daily with original Karachi spice blends and premium ingredients." },
  { icon: "🚴", title: "Fast Delivery",     text: "Our riders deliver hot food to your doorstep within 30 minutes." },
  { icon: "🔒", title: "Secure Payments",   text: "Pay via Cash, JazzCash, Easypaisa, or Credit Card — all secured." },
  { icon: "📱", title: "Easy Ordering",     text: "Order in seconds — track your food in real-time on our website or app." },
];

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu?featured=true`);
        const data = await res.json();
        if (data.success && data.data?.length) {
          setFeaturedItems(data.data);
        } else {
          setFeaturedItems(MOCK_ITEMS.filter((i) => i.isFeatured));
        }
      } catch {
        setFeaturedItems(MOCK_ITEMS.filter((i) => i.isFeatured));
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <>
      {/* ── HERO SECTION ──────────────────────────────────── */}
      <section
        className="hero-pattern"
        style={{
          background: "var(--grad-hero)",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "rgba(245, 158, 11, 0.12)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "rgba(124, 45, 18, 0.2)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />
        {/* Floating spice orbs */}
        {["🌶️", "🍃", "⭐", "✨"].map((s, i) => (
          <span
            key={i}
            className="animate-float"
            style={{
              position: "absolute",
              fontSize: "1.8rem",
              opacity: 0.25,
              top: `${20 + i * 18}%`,
              left: i % 2 === 0 ? `${8 + i * 3}%` : undefined,
              right: i % 2 !== 0 ? `${8 + i * 3}%` : undefined,
              animationDelay: `${i * 0.7}s`,
              pointerEvents: "none",
            }}
          >
            {s}
          </span>
        ))}

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              alignItems: "center",
              gap: "48px",
              padding: "80px 0 60px",
            }}
          >
            {/* Left — Text */}
            <div style={{ maxWidth: "560px" }}>
              <div
                className="animate-fade-up"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(254, 243, 199, 0.15)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(254, 243, 199, 0.25)",
                  borderRadius: "99px",
                  padding: "7px 18px",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  color: "#FEF3C7",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "20px",
                }}
              >
                🍛 UCP Branch · Now Open
              </div>

              <h1
                className="animate-fade-up delay-100"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.4rem, 5vw, 3.75rem)",
                  lineHeight: 1.1,
                  color: "#FEF3C7",
                  marginBottom: "20px",
                }}
              >
                The Taste of{" "}
                <span
                  style={{
                    color: "#F59E0B",
                    display: "block",
                  }}
                >
                  Karachi Biryani
                </span>
                In Lahore
              </h1>

              <p
                className="animate-fade-up delay-200"
                style={{
                  fontSize: "1.0625rem",
                  color: "rgba(254, 243, 199, 0.82)",
                  lineHeight: 1.7,
                  marginBottom: "36px",
                  maxWidth: "460px",
                }}
              >
                Authentic, fresh, and fragrant — straight from Karachi&apos;s famous
                streets to your doorstep. Fast delivery within the UCP area.
              </p>

              <div
                className="animate-fade-up delay-300"
                style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}
              >
                <Link
                  href="/menu"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px 32px",
                    borderRadius: "99px",
                    background: "#F59E0B",
                    color: "#1C0A00",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textDecoration: "none",
                    boxShadow: "0 6px 28px rgba(245, 158, 11, 0.45)",
                    transition: "all 0.2s ease",
                  }}
                >
                  🛒 Order Now
                </Link>
                <Link
                  href="/menu"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px 32px",
                    borderRadius: "99px",
                    background: "rgba(254, 243, 199, 0.1)",
                    color: "#FEF3C7",
                    fontWeight: 600,
                    fontSize: "1rem",
                    border: "2px solid rgba(254, 243, 199, 0.3)",
                    textDecoration: "none",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                  }}
                >
                  View Menu →
                </Link>
              </div>

              {/* Delivery note */}
              <div
                className="animate-fade-up delay-400"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "24px",
                  fontSize: "0.875rem",
                  color: "rgba(254, 243, 199, 0.65)",
                }}
              >
                <span>✅</span>
                <span>Free delivery on orders above Rs. 500 · COD available</span>
              </div>
            </div>

            {/* Right — Hero Visual */}
            <div
              className="animate-scale-in delay-200"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                className="animate-float"
                style={{
                  width: "clamp(280px, 40vw, 420px)",
                  height: "clamp(280px, 40vw, 420px)",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(245,158,11,0.25), rgba(124,45,18,0.15))",
                  border: "2px solid rgba(245, 158, 11, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(8rem, 15vw, 13rem)",
                  boxShadow:
                    "0 30px 80px rgba(0,0,0,0.35), inset 0 0 60px rgba(245,158,11,0.08)",
                  backdropFilter: "blur(4px)",
                  position: "relative",
                }}
              >
                🍛
                {/* Orbiting elements */}
                {["🌶️", "🧅", "⭐", "🍃"].map((s, i) => (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      fontSize: "1.6rem",
                      top: `${50 + 42 * Math.sin((i * Math.PI * 2) / 4)}%`,
                      left: `${50 + 42 * Math.cos((i * Math.PI * 2) / 4)}%`,
                      transform: "translate(-50%, -50%)",
                      animation: `spin-slow ${8 + i}s linear infinite`,
                      transformOrigin: `${-42 * Math.cos((i * Math.PI * 2) / 4)}px ${-42 * Math.sin((i * Math.PI * 2) / 4)}px`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div
            className="animate-fade-up delay-500"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1px",
              background: "rgba(254, 243, 199, 0.1)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid rgba(254, 243, 199, 0.15)",
              backdropFilter: "blur(8px)",
              marginBottom: "40px",
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "24px",
                  textAlign: "center",
                  background: "rgba(254, 243, 199, 0.05)",
                }}
              >
                <div
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: "1.75rem",
                    color: "#F59E0B",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "rgba(254, 243, 199, 0.65)",
                    fontWeight: 500,
                    marginTop: "4px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave divider */}
        <div
          style={{
            position: "absolute",
            bottom: -2,
            left: 0,
            right: 0,
            lineHeight: 0,
          }}
        >
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", width: "100%" }}
          >
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="var(--bg-primary)"
            />
          </svg>
        </div>
      </section>

      {/* ── CATEGORY SECTION ──────────────────────────────── */}
      <section className="section" style={{ paddingBottom: "40px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div className="section-tag">🍽️ Explore Our Menu</div>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-sub" style={{ margin: "10px auto 0" }}>
              From fragrant biryanis to refreshing drinks — we have something
              for every craving.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {MOCK_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="category-pill animate-scale-in"
                  style={{ minWidth: "100px" }}
                >
                  <span style={{ fontSize: "2rem" }}>{cat.emoji}</span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ITEMS ────────────────────────────────── */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "36px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div className="section-tag">⭐ Fan Favourites</div>
              <h2 className="section-title">Most Popular Items</h2>
            </div>
            <Link href="/menu" className="btn btn-secondary">
              See Full Menu →
            </Link>
          </div>

          {isLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "24px",
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "320px" }} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "24px",
              }}
            >
              {featuredItems.map((item, i) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <FoodCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="section-tag">💎 Why Choose Us</div>
            <h2 className="section-title">Made with Passion, Delivered with Care</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="card animate-fade-up"
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  animationDelay: `${i * 0.1}s`,
                  background: "var(--grad-card)",
                }}
              >
                <div style={{ fontSize: "2.8rem", marginBottom: "16px" }}>
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "8px",
                    color: "var(--text-primary)",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO ORDER ──────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "var(--grad-maroon)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(92,26,8,0.3) 0%, transparent 50%)",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              className="section-tag"
              style={{
                background: "rgba(245,158,11,0.2)",
                color: "#F59E0B",
              }}
            >
              📱 How It Works
            </div>
            <h2
              className="section-title"
              style={{ color: "#FEF3C7" }}
            >
              Order in 3 Simple Steps
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
              position: "relative",
            }}
          >
            {/* Connector line */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                left: "calc(16.66% + 20px)",
                right: "calc(16.66% + 20px)",
                height: "3px",
                background:
                  "linear-gradient(to right, rgba(245,158,11,0.4), rgba(245,158,11,0.4))",
                borderRadius: "99px",
              }}
            />

            {[
              { step: "01", icon: "🛒", title: "Browse & Add", text: "Explore our menu and add your favourite items to your cart." },
              { step: "02", icon: "📍", title: "Set Location",  text: "Enter your delivery address (within 2.2km of UCP campus)." },
              { step: "03", icon: "🚴", title: "Enjoy!",        text: "Place your order and wait — hot food delivered in ~30 min." },
            ].map((s, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{
                  textAlign: "center",
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "2px solid rgba(245, 158, 11, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: "2rem",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {s.icon}
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "#F59E0B",
                      color: "#1C0A00",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.step}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#FEF3C7",
                    marginBottom: "8px",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "rgba(254,243,199,0.68)", lineHeight: 1.6 }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link
              href="/menu"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "16px 40px",
                borderRadius: "99px",
                background: "#F59E0B",
                color: "#1C0A00",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "none",
                boxShadow: "0 8px 32px rgba(245, 158, 11, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              🍛 Start Ordering
            </Link>
          </div>
        </div>
      </section>

      {/* Responsive grid for hero */}
      <style>{`
        @media (max-width: 768px) {
          [data-hero-grid] {
            grid-template-columns: 1fr !important;
          }
          [data-stats-grid] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          [data-steps-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
