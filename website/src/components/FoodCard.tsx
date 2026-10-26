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
      className={`group rounded-3xl border border-black/5 dark:border-white/10 bg-black/5 p-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/5" style={{ background: "var(--bg-card)" }}>
        {/* Image Area */}
        <div className="relative w-full h-[190px] overflow-hidden flex items-center justify-center text-5xl shrink-0" style={{ background: "var(--surface)" }}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-5xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              {emoji}
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {item.isFeatured && (
              <span className="bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                🔥 Bestseller
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-gradient-to-br from-red-400 to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                🌶️ Spicy
              </span>
            )}
          </div>

          {/* Availability Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span
              className={`text-white text-[11px] font-bold px-2 py-1 rounded-md backdrop-blur-md ${
                item.isAvailable && item.inStock !== false ? "bg-emerald-500/90" : "bg-red-500/90"
              }`}
            >
              {item.isAvailable && item.inStock !== false ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Unavailable Overlay */}
          {(!item.isAvailable || item.inStock === false) && (
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm tracking-wide z-20">
              Currently Unavailable
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div>
            <h3 className="font-semibold text-base leading-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {item.name}
            </h3>
            {item.description && (
              <p className="line-clamp-2 text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            )}
          </div>

          {/* Prep Time & Meta */}
          <div className="flex items-center gap-3 text-xs font-medium mt-auto pt-1" style={{ color: "var(--text-muted)" }}>
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{item.preparationTime || 20} mins prep</span>
            </div>
            <span>•</span>
            <div className="text-amber-500">Fresh Daily</div>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Price</span>
              <span className="text-lg font-bold text-amber-500 tabular-nums">
                Rs. {parseFloat(item.price.toString()).toLocaleString()}
              </span>
            </div>

            {!item.isAvailable || item.inStock === false ? (
              <span className="text-xs text-slate-400 italic">Unavailable</span>
            ) : qty === 0 ? (
              <button
                onClick={handleAdd}
                className={`group/btn relative flex items-center justify-center h-9 px-4 rounded-full font-bold text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  added 
                    ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-95" 
                    : "bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                {added ? (
                  <span className="flex items-center gap-1">Added! ✓</span>
                ) : (
                  <span className="flex items-center gap-2">
                    Add
                    <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-transform group-hover/btn:rotate-180">
                      +
                    </span>
                  </span>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-3 p-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-color)" }}>
                <button
                  onClick={() => decrement(item.id)}
                  aria-label="Decrease"
                  className="w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors shadow-sm"
                  style={{ color: "var(--text-primary)", background: "var(--bg-card)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--saffron)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                >
                  −
                </button>
                <span className="font-bold text-sm w-4 text-center">{qty}</span>
                <button
                  onClick={() => increment(item.id)}
                  aria-label="Increase"
                  className="w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors shadow-sm"
                  style={{ color: "var(--text-primary)", background: "var(--bg-card)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--saffron)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
