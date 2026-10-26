"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  id: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  placedAt: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
        } else {
          setError(data.error || "Failed to load order history.");
        }
      } catch {
        setError("Network error. Could not retrieve orders.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [token, router]);

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "PENDING":
        return { bg: "#FFF8ED", text: "#C2410C", border: "#EA580C30" }; // Amber
      case "ACCEPTED":
      case "PREPARING":
      case "READY":
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#1D4ED820" }; // Blue
      case "OUT_FOR_DELIVERY":
        return { bg: "#FFF8ED", text: "#EA580C", border: "#EA580C30" }; // Orange
      case "DELIVERED":
        return { bg: "#ECFDF5", text: "#15803D", border: "#15803D20" }; // Green
      case "CANCELLED":
      case "REJECTED":
      default:
        return { bg: "#FEF2F2", text: "#B91C1C", border: "#B91C1C20" }; // Red
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: "var(--bg-primary, #FFF9F3)", minHeight: "92vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.75rem", marginBottom: "24px", color: "var(--text-primary)" }}>
            <span style={{ color: "#C2410C", marginRight: "8px" }}>|</span>My Orders
          </h1>
          {/* Skeleton Loaders */}
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card skeleton"
              style={{ height: "120px", marginBottom: "16px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary, #FFF9F3)", minHeight: "92vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.75rem", marginBottom: "24px", color: "var(--text-primary)", fontWeight: 700 }}>
          <span style={{ color: "#C2410C", marginRight: "8px" }}>|</span>My Orders
        </h1>

        {error && (
          <div style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: "var(--radius-md)", padding: "12px 16px", color: "#991B1B", minHeight: "44px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {orders.map((order) => {
            const badge = getStatusBadgeStyles(order.status);
            const formattedDate = new Date(order.placedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            const itemsSummary = order.orderItems.map((i) => `${i.itemName} x${i.quantity}`).join(", ");

            return (
              <Link key={order.id} href={`/track?orderId=${order.id}`}>
                <div
                  className="card order-card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-xl)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "transform var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1), box-shadow var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1), border-color var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "#EA580C"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 240px", paddingRight: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>Order #{order.id.slice(0, 8).toUpperCase()}</strong>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 700
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formattedDate}</span>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                      {itemsSummary}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Rs. {parseFloat(order.total.toString()).toFixed(0)}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#C2410C", border: "1px solid #C2410C", padding: "6px 12px", borderRadius: "var(--radius-full)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      Track Order <span style={{ fontSize: "1.1rem" }}>➔</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {orders.length === 0 && (
            <div className="card" style={{ padding: "40px", textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🛍️</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "8px", color: "var(--text-primary)" }}>No orders yet</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
                Delicious food is waiting for you!
              </p>
              <Link
                href="/menu"
                style={{
                  display: "inline-block",
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                  color: "#fff",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(194,65,12,0.35)",
                  transition: "transform var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                Browse Menu
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
