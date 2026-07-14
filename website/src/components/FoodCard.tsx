"use client";

import React, { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "@/context/CartContext";

interface FoodCardProps {
  item: MenuItem;
  className?: string;
}

// Fallback emoji images for items without photos
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
    <div className={`food-card ${className}`}>
      {/* Image Area */}
      <div className="food-card-img">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--grad-card)",
              fontSize: "3.5rem",
            }}
          >
            {emoji}
          </div>
        )}

        {/* Badges */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            gap: "6px",
          }}
        >
          {item.isFeatured && (
            <span
              className="badge badge-saffron"
              style={{
                background: "var(--saffron)",
                color: "#fff",
                fontSize: "0.65rem",
              }}
            >
              ⭐ Popular
            </span>
          )}
          {item.isSpicy && (
            <span
              className="badge badge-red"
              style={{ fontSize: "0.65rem" }}
            >
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Unavailable Overlay */}
        {!item.isAvailable && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Currently Unavailable
          </div>
        )}
      </div>

      {/* Info Area */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            {item.name}
          </h3>
          {item.description && (
            <p
              className="line-clamp-2"
              style={{
                fontSize: "0.825rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Prep time */}
        {item.preparationTime && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.775rem",
              color: "var(--text-muted)",
            }}
          >
            <span>⏱️</span>
            <span>{item.preparationTime} min</span>
          </div>
        )}

        {/* Price + Add to Cart */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "8px",
          }}
        >
          <span className="price-tag">{item.price}</span>

          {!item.isAvailable ? (
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
              className="btn btn-primary btn-sm"
              style={{
                transition: "all 0.2s ease",
                transform: added ? "scale(0.95)" : "scale(1)",
              }}
            >
              {added ? "✓ Added!" : "+ Add"}
            </button>
          ) : (
            <div className="qty-control">
              <button onClick={() => decrement(item.id)} aria-label="Decrease">
                −
              </button>
              <span>{qty}</span>
              <button onClick={() => increment(item.id)} aria-label="Increase">
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
