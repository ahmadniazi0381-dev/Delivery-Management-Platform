"use client";

import React, { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "@/context/CartContext";

interface FoodCardProps {
  item: MenuItem;
  className?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  1: "🍛",   // Biryani
  2: "🍚",   // Pulao
  3: "🥗",   // Salad / Raita
  4: "🥤",   // Drinks
  5: "🍗",   // Chicken
  6: "🫓",   // Bread
};

export default function FoodCard({ item, className = "" }: FoodCardProps) {
  const { addItem, increment, decrement, getItemQty } = useCart();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const qty = getItemQty(item.id);

  const handleAdd = () => {
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const emoji = item.imageUrl
    ? null
    : (CATEGORY_EMOJIS[String(item.categoryId)] ?? "🍽️");

  return (
    <div
      className={`food-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: isHovered
          ? "0 16px 36px -8px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(245, 158, 11, 0.15)"
          : "0 4px 16px -2px rgba(0, 0, 0, 0.08)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image Area */}
      <div
        className="food-card-img"
        style={{
          position: "relative",
          width: "100%",
          height: "190px",
          overflow: "hidden",
          background: "#1E293B",
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7C2D12 0%, #B45309 50%, #D97706 100%)",
              fontSize: "3.5rem",
              transform: isHovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {emoji}
          </div>
        )}

        {/* Badges Overlay */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            zIndex: 2,
          }}
        >
          {item.isFeatured && (
            <span
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#1C0A00",
                fontSize: "0.725rem",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                letterSpacing: "0.02em",
              }}
            >
              🔥 Bestseller
            </span>
          )}
          {item.isSpicy && (
            <span
              style={{
                background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
                color: "#FFFFFF",
                fontSize: "0.725rem",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Availability Badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 2,
          }}
        >
          <span
            style={{
              background: item.isAvailable && item.inStock !== false ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
              color: "#FFFFFF",
              backdropFilter: "blur(4px)",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            {item.isAvailable && item.inStock !== false ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        {/* Unavailable Overlay */}
        {(!item.isAvailable || item.inStock === false) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.95rem",
              letterSpacing: "0.03em",
              zIndex: 3,
            }}
          >
            Currently Unavailable
          </div>
        )}
      </div>

      {/* Info Area */}
      <div
        style={{
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "var(--text-primary)",
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              {item.name}
            </h3>
          </div>

          {item.description && (
            <p
              className="line-clamp-2"
              style={{
                fontSize: "0.825rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Prep Time & Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            fontWeight: 600,
            marginTop: "auto",
            paddingTop: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span>⏱️</span>
            <span>{item.preparationTime || 20} mins prep</span>
          </div>
          <span>•</span>
          <div style={{ color: "#F59E0B" }}>
            Fresh Daily
          </div>
        </div>

        {/* Price & Action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            borderTop: "1px solid var(--border)",
            marginTop: "6px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block" }}>Price</span>
            <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--saffron)" }}>
              Rs. {parseFloat(item.price.toString()).toLocaleString()}
            </span>
          </div>

          {!item.isAvailable || item.inStock === false ? (
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Unavailable
            </span>
          ) : qty === 0 ? (
            <button
              onClick={handleAdd}
              style={{
                background: added ? "var(--success)" : "var(--saffron)",
                color: "#1C0A00",
                border: "none",
                fontWeight: 800,
                fontSize: "0.85rem",
                padding: "9px 20px",
                borderRadius: "20px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                transition: "all 0.2s ease",
                transform: added ? "scale(0.96)" : "scale(1)",
              }}
            >
              {added ? "✓ Added!" : "+ Add to Cart"}
            </button>
          ) : (
            <div className="qty-control" style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-secondary)", padding: "4px 10px", borderRadius: "20px", border: "1px solid var(--border)" }}>
              <button onClick={() => decrement(item.id)} aria-label="Decrease" style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>
                −
              </button>
              <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{qty}</span>
              <button onClick={() => increment(item.id)} aria-label="Increase" style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
