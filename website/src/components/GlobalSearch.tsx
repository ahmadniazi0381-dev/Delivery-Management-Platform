"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, ShoppingBag, Users, UserCog, Utensils, Bike,
  Clock, ArrowRight, Hash, Command
} from "lucide-react";
import { formatApiUrl } from "@/features/admin/hooks/useAdminApi";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG = {
  orders: {
    label: "Orders",
    icon: <ShoppingBag size={16} />,
    color: "#6366f1",
    toResult: (o: any): SearchResult => ({
      id: o.id,
      title: `Order #${o.orderNumber || o.id.slice(0, 8)}`,
      subtitle: `${o.customer?.name || "Customer"} · Rs. ${o.total || 0} · ${o.status}`,
      href: "/dashboard/orders",
      category: "orders",
      icon: <ShoppingBag size={14} />,
    }),
  },
  customers: {
    label: "Customers",
    icon: <Users size={16} />,
    color: "#10b981",
    toResult: (c: any): SearchResult => ({
      id: c.id,
      title: c.name,
      subtitle: `${c.phone || c.email || "No contact"} · ${c.orderCount || 0} orders`,
      href: "/dashboard/customers",
      category: "customers",
      icon: <Users size={14} />,
    }),
  },
  staff: {
    label: "Staff",
    icon: <UserCog size={16} />,
    color: "#d97706",
    toResult: (s: any): SearchResult => ({
      id: s.id,
      title: s.user?.name || s.name || "Staff",
      subtitle: `${s.staffRole} · ${s.isActive ? "Active" : "Suspended"}`,
      href: "/dashboard/staff",
      category: "staff",
      icon: <UserCog size={14} />,
    }),
  },
};

function getStoredRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem("ks_recent_searches") || "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const existing = getStoredRecent().filter(q => q !== query);
    localStorage.setItem("ks_recent_searches", JSON.stringify([query, ...existing].slice(0, 5)));
  } catch {}
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("naseeb_token");
}

export function GlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Global Search (Ctrl+K)"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 14px", borderRadius: 10,
        background: "var(--bg-secondary)", border: "1px solid var(--border)",
        color: "var(--text-secondary)", cursor: "pointer",
        fontSize: "0.82rem", fontWeight: 500,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#6366f1")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <Search size={14} />
      <span>Search…</span>
      <kbd style={{
        display: "inline-flex", alignItems: "center", gap: 2,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 5, padding: "1px 6px", fontSize: "0.68rem",
        color: "var(--text-secondary)", fontFamily: "monospace",
      }}>
        <Command size={9} />K
      </kbd>
    </button>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setRecent(getStoredRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[selectedIdx]) {
        navigateTo(results[selectedIdx]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selectedIdx]);

  const navigateTo = (result: SearchResult) => {
    saveRecent(query);
    router.push(result.href);
    setOpen(false);
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setSelectedIdx(0);
    const token = getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [ordersRes, customersRes, staffRes] = await Promise.allSettled([
        fetch(formatApiUrl(`/api/owner/orders?search=${encodeURIComponent(q)}&limit=4`), { headers }),
        fetch(formatApiUrl(`/api/owner/customers?search=${encodeURIComponent(q)}&limit=4`), { headers }),
        fetch(formatApiUrl(`/api/owner/staff?search=${encodeURIComponent(q)}&limit=3`), { headers }),
      ]);

      const combined: SearchResult[] = [];

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        const list = data.data || data || [];
        combined.push(...(Array.isArray(list) ? list : []).slice(0, 4).map(CATEGORY_CONFIG.orders.toResult));
      }
      if (customersRes.status === "fulfilled" && customersRes.value.ok) {
        const data = await customersRes.value.json();
        const list = data.data || data || [];
        combined.push(...(Array.isArray(list) ? list : []).slice(0, 4).map(CATEGORY_CONFIG.customers.toResult));
      }
      if (staffRes.status === "fulfilled" && staffRes.value.ok) {
        const data = await staffRes.value.json();
        const list = data.data || data || [];
        combined.push(...(Array.isArray(list) ? list : []).slice(0, 3).map(CATEGORY_CONFIG.staff.toResult));
      }

      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "10vh", padding: "10vh 16px 0",
      }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 600,
        border: "1px solid var(--border)", overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <Search size={20} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search orders, customers, staff, menu…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: "1rem", color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {loading && (
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: "2px solid var(--border)", borderTopColor: "#6366f1",
              animation: "spin 0.8s linear infinite",
            }} />
          )}
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results / Recent */}
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {query.trim() === "" ? (
            <div style={{ padding: "12px 0" }}>
              {recent.length > 0 && (
                <>
                  <div style={{ padding: "6px 20px 4px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Recent Searches
                  </div>
                  {recent.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQueryChange(q)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 20px", background: "none", border: "none",
                        cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.88rem",
                        textAlign: "left",
                      }}
                    >
                      <Clock size={14} /> {q}
                    </button>
                  ))}
                </>
              )}
              <div style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Type to search across orders, customers, staff and more
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
              <Search size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <p>No results for "{query}"</p>
            </div>
          ) : (
            <>
              {["orders", "customers", "staff"].map(cat => {
                const catResults = results.filter(r => r.category === cat);
                if (catResults.length === 0) return null;
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
                return (
                  <div key={cat}>
                    <div style={{ padding: "8px 20px 4px", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: config.color }}>{config.icon}</span> {config.label}
                    </div>
                    {catResults.map((result, i) => {
                      const globalIdx = results.indexOf(result);
                      const isSelected = globalIdx === selectedIdx;
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigateTo(result)}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 20px", background: isSelected ? "rgba(99,102,241,0.08)" : "none",
                            border: "none", cursor: "pointer", textAlign: "left",
                            transition: "background 0.1s",
                          }}
                        >
                          <span style={{ color: config.color, flexShrink: 0 }}>{result.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.88rem" }}>{result.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.subtitle}</div>
                          </div>
                          {isSelected && <ArrowRight size={14} style={{ color: "#6366f1", flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 16, fontSize: "0.72rem", color: "var(--text-secondary)" }}>
          <span><kbd style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "1px 5px", border: "1px solid var(--border)" }}>↑↓</kbd> Navigate</span>
          <span><kbd style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "1px 5px", border: "1px solid var(--border)" }}>Enter</kbd> Go</span>
          <span><kbd style={{ background: "var(--bg-secondary)", borderRadius: 4, padding: "1px 5px", border: "1px solid var(--border)" }}>Esc</kbd> Close</span>
        </div>
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
