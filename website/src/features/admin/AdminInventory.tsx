"use client";

import React, { useState } from "react";
import {
  Package, AlertTriangle, RefreshCw, Plus, Edit3, Save, X, CheckCircle, AlertCircle
} from "lucide-react";
import { useAdminQuery, adminFetch } from "./hooks/useAdminApi";
import { SkeletonCard } from "./components/SkeletonLoader";

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string | null;
  lowStockThreshold: number;
  menuItem: { name: string; image: string | null } | null;
}

function AlertBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) return (
    <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}>
      OUT OF STOCK
    </span>
  );
  if (stock <= threshold) return (
    <span style={{ background: "rgba(245,158,11,0.12)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}>
      LOW STOCK
    </span>
  );
  return (
    <span style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700 }}>
      IN STOCK
    </span>
  );
}

function StockEditRow({ item, onSave }: { item: InventoryItem; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(item.stock);
  const [threshold, setThreshold] = useState(item.lowStockThreshold);
  const [saving, setSaving] = useState(false);

  const isLow = item.stock <= item.lowStockThreshold && item.stock > 0;
  const isOut = item.stock === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch(`/api/owner/menu/${item.id}/stock`, {
        method: "PUT",
        body: JSON.stringify({ stock, lowStockThreshold: threshold }),
      });
      onSave();
      setEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
      borderRadius: 12,
      background: isOut ? "rgba(239,68,68,0.04)" : isLow ? "rgba(245,158,11,0.04)" : "var(--bg-secondary)",
      border: `1px solid ${isOut ? "rgba(239,68,68,0.2)" : isLow ? "rgba(245,158,11,0.2)" : "var(--border)"}`,
      transition: "all 0.2s",
    }}>
      {/* Icon / Image */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: isOut ? "rgba(239,68,68,0.12)" : isLow ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {item.menuItem?.image ? (
          <img src={item.menuItem.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
        ) : (
          <Package size={20} color={isOut ? "#ef4444" : isLow ? "#d97706" : "#10b981"} />
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.name}
        </div>
        {item.menuItem && item.menuItem.name !== item.name && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{item.menuItem.name}</div>
        )}
      </div>

      {/* Badge */}
      <AlertBadge stock={item.stock} threshold={item.lowStockThreshold} />

      {/* Stock Display or Edit */}
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: 3, fontWeight: 600 }}>STOCK</div>
            <input
              type="number" min={0} value={stock}
              onChange={e => setStock(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "0.85rem", textAlign: "center" }}
            />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: 3, fontWeight: 600 }}>THRESHOLD</div>
            <input
              type="number" min={0} value={threshold}
              onChange={e => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 70, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "0.85rem", textAlign: "center" }}
            />
          </div>
          <button onClick={handleSave} disabled={saving} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", fontWeight: 600 }}>
            {saving ? "…" : <><Save size={13} /> Save</>}
          </button>
          <button onClick={() => setEditing(false)} style={{ padding: "6px 8px", borderRadius: 8, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: isOut ? "#ef4444" : isLow ? "#d97706" : "#10b981" }}>
              {item.stock}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              {item.unit || "units"} · alert at {item.lowStockThreshold}
            </div>
          </div>
          <button onClick={() => setEditing(true)}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 600 }}>
            <Edit3 size={12} /> Update
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminInventory() {
  const { data: alertsData, loading: alertsLoading, refetch: refetchAlerts } = useAdminQuery<{ items: InventoryItem[] }>("/api/owner/inventory/alerts", []);
  const { data: allData, loading: allLoading, refetch: refetchAll } = useAdminQuery<{ items: InventoryItem[] }>("/api/owner/inventory", []);
  const [tab, setTab] = useState<"alerts" | "all">("alerts");

  const refetch = () => { refetchAlerts(); refetchAll(); };
  const items = tab === "alerts" ? (alertsData?.items || []) : (allData?.items || []);
  const loading = tab === "alerts" ? alertsLoading : allLoading;

  const outOfStock = (allData?.items || []).filter(i => i.stock === 0).length;
  const lowStock = (allData?.items || []).filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const inStock = (allData?.items || []).filter(i => i.stock > i.lowStockThreshold).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Inventory Alerts</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
            Track stock levels and get alerts for low or depleted items.
          </p>
        </div>
        <button onClick={refetch} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {[
          { label: "Out of Stock", value: outOfStock, color: "#ef4444" },
          { label: "Low Stock", value: lowStock, color: "#d97706" },
          { label: "In Stock", value: inStock, color: "#10b981" },
          { label: "Total Items", value: (allData?.items || []).length, color: "#6366f1" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 10, padding: 4, border: "1px solid var(--border)", width: "fit-content", gap: 4 }}>
        {(["alerts", "all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t ? "var(--bg-card)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: tab === t ? 700 : 500, fontSize: "0.85rem",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.15s",
            }}>
            {t === "alerts" ? `⚠ Alerts${alertsData?.items.length ? ` (${alertsData.items.length})` : ""}` : "All Items"}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} h="72px" />)
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            {tab === "alerts" ? (
              <>
                <CheckCircle size={40} style={{ color: "#10b981", marginBottom: 12 }} />
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>All stocked up!</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 6 }}>No inventory alerts at this time.</p>
              </>
            ) : (
              <>
                <Package size={40} style={{ color: "var(--text-secondary)", marginBottom: 12 }} />
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>No inventory items</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 6 }}>Set stock levels on menu items to track inventory here.</p>
              </>
            )}
          </div>
        ) : (
          items.map(item => (
            <StockEditRow key={item.id} item={item} onSave={refetch} />
          ))
        )}
      </div>
    </div>
  );
}
