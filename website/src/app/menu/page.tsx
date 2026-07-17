"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MenuItem, MenuCategory } from "@/types";
import FoodCard from "@/components/FoodCard";

// Mock data for development
const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 0, name: "All",     emoji: "🍽️", sortOrder: 0 },
  { id: 1, name: "Biryani", emoji: "🍛",  sortOrder: 1 },
  { id: 2, name: "Pulao",   emoji: "🍚",  sortOrder: 2 },
  { id: 3, name: "Raita",   emoji: "🥛",  sortOrder: 3 },
  { id: 4, name: "Drinks",  emoji: "🥤",  sortOrder: 4 },
  { id: 5, name: "Extras",  emoji: "🍗",  sortOrder: 5 },
];

const MOCK_ITEMS: MenuItem[] = [
  { id: 1, name: "Karachi Special Biryani",   description: "Authentic Karachi-style beef biryani with fragrant basmati, saffron, and whole spices — our signature dish.", price: 380, categoryId: 1, isAvailable: true, isFeatured: true,  isSpicy: true,  preparationTime: 20 },
  { id: 2, name: "Chicken Biryani",            description: "Tender chicken with aromatic spices and perfectly cooked, layered basmati rice.", price: 320, categoryId: 1, isAvailable: true, isFeatured: true,  isSpicy: false, preparationTime: 18 },
  { id: 3, name: "Beef Biryani",               description: "Rich, slow-cooked beef biryani with a deep masala base and golden fried onions on top.", price: 360, categoryId: 1, isAvailable: true,                   isSpicy: true,  preparationTime: 22 },
  { id: 4, name: "Mutton Biryani",             description: "Premium mutton pieces cooked in aromatic whole spices — a royal treat.", price: 440, categoryId: 1, isAvailable: true,                   isSpicy: true,  preparationTime: 30 },
  { id: 5, name: "Mutton Pulao",               description: "Slow-cooked mutton pulao with aromatic rice infused with rich bone stock.", price: 420, categoryId: 2, isAvailable: true, isFeatured: true,  isSpicy: false, preparationTime: 25 },
  { id: 6, name: "Chicken Pulao",              description: "Flavourful chicken pulao with a light, golden broth that flavours every grain of rice.", price: 290, categoryId: 2, isAvailable: true,                   isSpicy: false, preparationTime: 20 },
  { id: 7, name: "Beef Pulao",                 description: "Tender beef with a smoky, savory pulao rice. Comfort food at its finest.", price: 350, categoryId: 2, isAvailable: true,                   isSpicy: false, preparationTime: 22 },
  { id: 8, name: "Dahi Raita",                 description: "Fresh whipped yogurt with roasted cumin, mint, and a hint of red chilli.", price: 80,  categoryId: 3, isAvailable: true,                                   preparationTime: 5  },
  { id: 9, name: "Aloo Raita",                 description: "Chunky potato raita with spiced yogurt — the perfect biryani companion.", price: 90,  categoryId: 3, isAvailable: true,                                   preparationTime: 5  },
  { id: 10, name: "Boondi Raita",              description: "Crispy boondi soaked in tangy spiced yogurt. Light and refreshing.", price: 85,  categoryId: 3, isAvailable: true,                                   preparationTime: 5  },
  { id: 11, name: "Lassi (Sweet)",             description: "Creamy, chilled sweet lassi made with fresh yogurt — a Pakistani classic.", price: 120, categoryId: 4, isAvailable: true,                                   preparationTime: 3  },
  { id: 12, name: "Lassi (Salted)",            description: "Refreshing salted lassi with a hint of cumin and fresh mint.", price: 120, categoryId: 4, isAvailable: true,                                   preparationTime: 3  },
  { id: 13, name: "Rooh Afza Drink",           description: "Chilled Rooh Afza with milk and a touch of rose water.", price: 100, categoryId: 4, isAvailable: true,                                   preparationTime: 3  },
  { id: 14, name: "Cold Water",                description: "Chilled mineral water bottle.", price: 60,  categoryId: 4, isAvailable: true,                                   preparationTime: 1  },
  { id: 15, name: "Naan / Chapati",            description: "Freshly baked soft naan or chapati — great with raita.", price: 40,  categoryId: 5, isAvailable: true,                                   preparationTime: 8  },
  { id: 16, name: "Chicken Tikka (4 pcs)",     description: "Tender charcoal-grilled chicken tikka with green chutney.", price: 280, categoryId: 5, isAvailable: true,                   isSpicy: true,  preparationTime: 15 },
];

function MenuContent() {
  const searchParams                    = useSearchParams();
  const initCategory                    = Number(searchParams.get("category")) || 0;

  const [categories,  setCategories]   = useState<MenuCategory[]>(MOCK_CATEGORIES);
  const [allItems,    setAllItems]      = useState<MenuItem[]>(MOCK_ITEMS);
  const [activeCategory, setActive]    = useState<number | string>(initCategory);
  const [search,      setSearch]        = useState("");
  const [sortBy,      setSortBy]        = useState<"default" | "price_asc" | "price_desc">("default");
  const [isLoading,   setIsLoading]     = useState(false);

  // Fetch from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/menu`),
        ]);
        const catData  = await catRes.json();
        const itemData = await itemRes.json();
        if (catData.success && catData.data?.length) {
          setCategories([{ id: 0, name: "All", emoji: "🍽️", sortOrder: 0 }, ...catData.data]);
        }
        if (itemData.success && itemData.data?.length) {
          setAllItems(itemData.data);
        }
      } catch {
        // Fallback: use mock data already set
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter + sort
  const filteredItems = useCallback(() => {
    let items = [...allItems];
    if (activeCategory !== 0) {
      items = items.filter((i) => i.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    if (sortBy === "price_asc")  items.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") items.sort((a, b) => b.price - a.price);
    return items;
  }, [allItems, activeCategory, search, sortBy]);

  const items = filteredItems();

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--grad-maroon)",
          padding: "48px 0 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 70% 50%, rgba(245,158,11,0.15), transparent 60%)",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-tag" style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>
            🍽️ Our Menu
          </div>
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "#FEF3C7",
              marginTop: "8px",
              marginBottom: "8px",
            }}
          >
            Explore Everything We Make
          </h1>
          <p style={{ color: "rgba(254,243,199,0.72)", fontSize: "1rem", maxWidth: "480px" }}>
            Fresh, authentic, and made to order. Browse our full menu and add
            your favourites to the cart.
          </p>
        </div>
      </div>

      {/* ── Controls (Search + Sort + Categories) ─────────────────── */}
      <div
        style={{
          position: "sticky",
          top: "72px",
          zIndex: 100,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          marginTop: "-40px",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        }}
      >
        {/* Search + Sort Row */}
        <div
          className="container"
          style={{
            padding: "16px 20px 0",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div className="input-group" style={{ flex: "1", minWidth: "200px" }}>
            <span className="input-icon" aria-hidden="true">🔍</span>
            <label htmlFor="menu-search" className="sr-only">Search menu items</label>
            <input
              type="search"
              className="input"
              placeholder="Search biryani, pulao, drinks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="menu-search"
              aria-label="Search menu items"
              autoComplete="off"
            />
          </div>

          {/* Sort */}
          <label htmlFor="menu-sort" className="sr-only">Sort by</label>
          <select
            className="input"
            style={{ width: "auto", minWidth: "160px" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            id="menu-sort"
            aria-label="Sort menu items"
          >
            <option value="default">Sort: Default</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Category Pills Row */}
        <div
          className="container hide-scrollbar"
          style={{
            padding: "12px 20px 16px",
            display: "flex",
            gap: "8px",
            overflowX: "auto",
          }}
          role="tablist"
          aria-label="Menu categories"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`category-pill ${activeCategory === cat.id ? "active" : ""}`}
              style={{
                padding: "8px 18px",
                flexDirection: "row",
                gap: "6px",
                fontSize: "0.875rem",
              }}
              id={`cat-pill-${cat.id}`}
              role="tab"
              aria-selected={activeCategory === cat.id}
              aria-label={`${cat.name} category`}
            >
              <span aria-hidden="true">{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Items Grid ─────────────────────────────────────────────── */}
      <div className="container" style={{ padding: "40px 20px 80px" }}>
        {/* Result count */}
        <div
          style={{
            marginBottom: "24px",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          Showing{" "}
          <strong style={{ color: "var(--text-primary)" }}>{items.length}</strong>{" "}
          item{items.length !== 1 ? "s" : ""}
          {search && (
            <>
              {" for "}&ldquo;<strong style={{ color: "var(--saffron)" }}>{search}</strong>&rdquo;
            </>
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px",
            }}
            aria-label="Loading menu items"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "320px" }} aria-hidden="true" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
            }}
            role="status"
          >
            <div style={{ fontSize: "4rem", marginBottom: "16px" }} aria-hidden="true">🍽️</div>
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                marginBottom: "8px",
                color: "var(--text-primary)",
              }}
            >
              No items found
            </h3>
            <p style={{ color: "var(--text-muted)" }}>
              Try a different search term or category.
            </p>
            <button
              onClick={() => { setSearch(""); setActive(0); }}
              className="btn btn-primary"
              style={{ marginTop: "20px" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
              >
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }} aria-hidden="true">🍛</div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading menu...</p>
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
