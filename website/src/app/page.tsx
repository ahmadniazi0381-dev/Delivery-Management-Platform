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
  { id: 1, name: "Special Biryani", description: "Fragrant basmati, saffron, and whole spices.", price: 380, categoryId: 1, isAvailable: true, isFeatured: true, isSpicy: true, preparationTime: 20 },
  { id: 2, name: "Chicken Biryani", description: "Tender chicken pieces cooked with aromatic spices and layered with perfectly cooked rice.", price: 320, categoryId: 1, isAvailable: true, isFeatured: true, preparationTime: 18 },
  { id: 3, name: "Mutton Pulao", description: "Slow-cooked mutton with whole spices, served with aromatic rice infused with the bone stock.", price: 420, categoryId: 2, isAvailable: true, isFeatured: true, isSpicy: false, preparationTime: 25 },
  { id: 4, name: "Chicken Pulao", description: "Flavourful chicken pulao with a light, golden broth that elevates every grain of rice.", price: 290, categoryId: 2, isAvailable: true, preparationTime: 20 },
  { id: 5, name: "Dahi Raita", description: "Fresh whipped yogurt with roasted cumin, mint, and a hint of red chilli.", price: 80, categoryId: 3, isAvailable: true, preparationTime: 5 },
  { id: 6, name: "Aloo Raita", description: "Chunky potato raita with spiced yogurt.", price: 90, categoryId: 3, isAvailable: true, preparationTime: 5 },
  { id: 7, name: "Lassi (Sweet)", description: "Creamy, chilled sweet lassi made with fresh yogurt.", price: 120, categoryId: 4, isAvailable: true, preparationTime: 3 },
  { id: 8, name: "Rooh Afza Drink", description: "Refreshing chilled drink with milk and a touch of rose water.", price: 100, categoryId: 4, isAvailable: true, preparationTime: 3 },
];

const STATS = [
  { value: "5,000+", label: "Happy Customers",  icon: "😊" },
  { value: "4.8★",   label: "Average Rating",    icon: "⭐" },
  { value: "30min",  label: "Avg Delivery Time",  icon: "🚴" },
  { value: "2.2km",  label: "Delivery Radius",   icon: "📍" },
];

const FEATURES = [
  { icon: "🌿", title: "Fresh & Authentic",   text: "Prepared daily with premium ingredients and curated spice blends." },
  { icon: "🚴", title: "Fast Delivery",        text: "Our riders deliver hot food to your doorstep within 30 minutes." },
  { icon: "🔒", title: "Secure Payments",      text: "Pay via Cash, JazzCash, Easypaisa or Cards — fully secured." },
  { icon: "📱", title: "Real-time Tracking",   text: "Order and track your food in real-time from kitchen to door." },
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  useScrollReveal();

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
      <style>{`
        /* Scroll reveal */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition:
            opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 80ms; }
        .reveal-d2 { transition-delay: 160ms; }
        .reveal-d3 { transition-delay: 240ms; }
        .reveal-d4 { transition-delay: 320ms; }
        .reveal-d5 { transition-delay: 400ms; }

        /* Hero floating elements */
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-10px) rotate(2deg); }
          66%       { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes hero-float-alt {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-14px) rotate(-3deg); }
        }
        .float-hero    { animation: hero-float     4s ease-in-out infinite; }
        .float-hero-alt { animation: hero-float-alt 5s ease-in-out infinite; }

        /* Stat counter shimmer */
        .stat-shine:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(194,65,12,0.08) 0%, transparent 60%);
          border-radius: inherit;
          pointer-events: none;
        }
        .stat-shine { position: relative; }

        /* Category card hover */
        .cat-card {
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 0.2s ease;
        }
        .cat-card:hover { transform: translateY(-4px); }

        /* Feature card hover */
        .feat-card {
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .feat-card:hover { transform: translateY(-4px); }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .cat-card, .feat-card { transition: opacity 0.3s ease; transform: none !important; }
          .float-hero, .float-hero-alt { animation: none; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28"
        style={{
          background: "linear-gradient(160deg, #0C0705 0%, #1A0E08 50%, #24130B 100%)",
          color: "#fff",
        }}
      >
        {/* Warm glow orbs */}
        <div className="absolute top-[-8%] left-[-8%] w-[52%] h-[52%] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(194,65,12,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-8%] w-[44%] h-[44%] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(234,88,12,0.14) 0%, transparent 70%)" }} />
        <div className="absolute top-[30%] right-[15%] w-[28%] h-[28%] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)" }} />

        <div className="container relative z-10 px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Text */}
            <div className="max-w-2xl">
              {/* Eyebrow badge */}
              <div className="reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold tracking-[0.12em] uppercase" style={{ background: "rgba(194,65,12,0.15)", border: "1px solid rgba(194,65,12,0.3)", color: "#FBBF24" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#10b981" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#10b981" }} />
                </span>
                Delivery Platform • Fast &amp; Reliable
              </div>

              <h1 className="reveal reveal-d1 font-extrabold leading-[1.08] mb-6 tracking-tight" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
                GOOD FOOD.<br />
                <span style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  backgroundImage: "linear-gradient(135deg, #F59E0B 0%, #EA580C 60%, #C2410C 100%)",
                }}>
                  DELIVERED FAST.
                </span>
              </h1>

              <p className="reveal reveal-d2 leading-relaxed mb-8 max-w-[46ch]" style={{ fontSize: "1.1rem", color: "rgba(255,249,243,0.76)" }}>
                Delicious food delivered fast to your doorstep. Freshly prepared meals, live real-time tracking, and doorstep delivery in under 30 minutes.
              </p>

              {/* CTAs */}
              <div className="reveal reveal-d3 flex flex-wrap gap-4 items-center mb-8">
                <Link
                  href="/menu"
                  className="group inline-flex items-center justify-center gap-3 font-bold rounded-full transition-all"
                  style={{
                    background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                    color: "#fff",
                    padding: "14px 28px",
                    boxShadow: "0 4px 24px rgba(194,65,12,0.40)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Order Now
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: "rgba(255,255,255,0.18)" }}>→</span>
                </Link>

                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-full"
                  style={{
                    padding: "14px 28px",
                    border: "1px solid rgba(255,249,243,0.18)",
                    color: "rgba(255,249,243,0.85)",
                    background: "rgba(255,249,243,0.06)",
                    backdropFilter: "blur(8px)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Explore Menu
                </Link>
              </div>

              {/* Delivery Badge */}
              <div className="reveal reveal-d4 inline-flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,249,243,0.07)", border: "1px solid rgba(255,249,243,0.12)", backdropFilter: "blur(8px)" }}>
                <span className="text-xl">🚴</span>
                <span style={{ fontSize: "0.875rem", color: "rgba(255,249,243,0.8)" }}>Average Delivery Time: <span style={{ color: "#F59E0B", fontWeight: 700 }}>25–30 Mins</span></span>
              </div>
            </div>

            {/* Right — Featured Food Showcase Card */}
            <div className="reveal reveal-d2 relative hidden lg:flex justify-center items-center">
              <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl" style={{
                background: "linear-gradient(145deg, rgba(36,19,11,0.92) 0%, rgba(20,10,5,0.96) 100%)",
                border: "1px solid rgba(245,158,11,0.22)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}>
                {/* Dish Presentation */}
                <div className="relative rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center text-center mb-5" style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(234,88,12,0.2) 0%, rgba(12,7,5,0.7) 100%)",
                  border: "1px solid rgba(194,65,12,0.2)",
                  minHeight: "220px",
                }}>
                  <div className="text-7xl mb-3 select-none filter drop-shadow-[0_12px_24px_rgba(234,88,12,0.4)]">
                    🍛
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#FBBF24" }}>
                    🔥 Signature Dish
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Special Biryani</h3>
                    <p className="text-xs" style={{ color: "rgba(255,249,243,0.7)" }}>Aromatic basmati, saffron &amp; whole spices</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs block text-amber-400 font-semibold uppercase">Price</span>
                    <span className="text-2xl font-black text-amber-500 tabular-nums">Rs. 380</span>
                  </div>
                </div>

                {/* Bottom perks strip */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "rgba(255,249,243,0.1)" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,249,243,0.8)" }}>
                    <span className="text-amber-400">⭐</span>
                    <span className="font-semibold">4.8 Rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs justify-end" style={{ color: "rgba(255,249,243,0.8)" }}>
                    <span className="text-emerald-400">⚡</span>
                    <span className="font-semibold">Hot &amp; Fresh</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="relative z-20" style={{ marginTop: "-3rem", padding: "0 1.5rem" }}>
        <div className="mx-auto max-w-5xl reveal">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 overflow-hidden rounded-3xl" style={{ border: "1px solid rgba(194,65,12,0.15)", boxShadow: "0 8px 40px rgba(12,7,5,0.25)" }}>
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="stat-shine text-center p-6 md:p-8"
                style={{
                  background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)",
                  borderRight: i < 3 ? "1px solid var(--border-color)" : "none",
                  borderBottom: i < 2 ? "1px solid var(--border-color)" : "none",
                }}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="font-black mb-1" style={{
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {stat.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-28 relative bg-warm-dots" style={{ background: "var(--bg-secondary)" }}>
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: "rgba(194,65,12,0.1)", color: "#C2410C" }}>🍽️ Explore Menu</span>
            <h2 className="font-bold" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "var(--text-primary)" }}>Browse by Category</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {MOCK_CATEGORIES.map((cat, i) => (
              <Link key={cat.id} href={`/menu?category=${cat.id}`} className={`reveal reveal-d${i + 1}`}>
                <div className="cat-card group flex flex-col items-center justify-center rounded-3xl p-6 min-w-[120px] cursor-pointer"
                  style={{
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--border-color)",
                    boxShadow: "var(--shadow-card)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#EA580C";
                    el.style.boxShadow = "0 8px 24px rgba(194,65,12,0.18)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-color)";
                    el.style.boxShadow = "var(--shadow-card)";
                  }}
                >
                  <span className="text-4xl mb-3 block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">{cat.emoji}</span>
                  <span className="text-sm font-semibold transition-colors duration-200" style={{ color: "var(--text-secondary)" }}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ITEMS ───────────────────────────────────── */}
      <section className="py-28" style={{ background: "var(--bg-primary)" }}>
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 reveal">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: "rgba(245,158,11,0.12)", color: "#D97706" }}>⭐ Fan Favourites</span>
              <h2 className="font-bold" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "var(--text-primary)" }}>Trending Now</h2>
            </div>
            <Link href="/menu" className="inline-flex items-center gap-2 font-semibold transition-colors duration-200 group" style={{ color: "#EA580C" }}>
              See Full Menu
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[360px] rounded-3xl skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item, i) => (
                <div key={item.id} className={`reveal reveal-d${Math.min(i + 1, 5)}`}>
                  <FoodCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="py-28 relative bg-warm-mesh" style={{ background: "var(--bg-secondary)" }}>
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 reveal">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.12em] uppercase" style={{ background: "rgba(194,65,12,0.1)", color: "#C2410C" }}>💎 Why Choose Us</span>
            <h2 className="font-bold" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "var(--text-primary)" }}>Made with Passion, Delivered with Care</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`feat-card reveal reveal-d${i + 1} rounded-3xl p-8`}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-card)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6" style={{ background: "rgba(194,65,12,0.1)" }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-28" style={{ background: "linear-gradient(135deg, #0C0705 0%, #1A0E08 100%)" }}>
        <div className="container mx-auto max-w-4xl px-6 text-center reveal">
          <h2 className="font-extrabold mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "#FFF9F3" }}>Ready to Order?</h2>
          <p className="mb-10 max-w-md mx-auto" style={{ color: "rgba(255,249,243,0.6)", fontSize: "1.0625rem" }}>Fresh food, real-time tracking, and seamless delivery — all in one place.</p>
          <Link
            href="/menu"
            className="group inline-flex items-center gap-3 font-bold rounded-full"
            style={{
              background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
              color: "#fff",
              padding: "16px 36px",
              fontSize: "1.0625rem",
              boxShadow: "0 8px 32px rgba(194,65,12,0.5)",
              transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s cubic-bezier(0.22,1,0.36,1)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
          >
            Explore Full Menu
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-300 group-hover:translate-x-1" style={{ background: "rgba(255,255,255,0.2)" }}>→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
