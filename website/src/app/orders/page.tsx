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
        return { bg: "#FEF3C7", text: "#D97706" }; // Amber
      case "ACCEPTED":
      case "PREPARING":
        return { bg: "#FFEDD5", text: "#EA580C" }; // Orange
      case "READY":
      case "OUT_FOR_DELIVERY":
        return { bg: "#DBEAFE", text: "#2563EB" }; // Blue
      case "DELIVERED":
        return { bg: "#DCFCE7", text: "#16A34A" }; // Green
      case "CANCELLED":
      case "REJECTED":
      default:
        return { bg: "#FEE2E2", text: "#DC2626" }; // Red
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.75rem", marginBottom: "24px" }}>
            My Orders
          </h1>
          {/* Skeleton Loaders */}
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="card shimmer"
              style={{ height: "120px", marginBottom: "16px", background: "var(--bg-card)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "92vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.75rem", marginBottom: "24px", color: "var(--text-primary)" }}>
          My Orders
        </h1>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "var(--error)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "20px" }}>
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
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div
                  className="card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, paddingRight: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <strong style={{ fontSize: "1.05rem" }}>Order #{order.id.slice(0, 8).toUpperCase()}</strong>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.text,
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

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--saffron-dark)" }}>
                      Rs. {parseFloat(order.total.toString()).toFixed(0)}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--saffron)", display: "flex", alignItems: "center", gap: "2px" }}>
                      Track Order ➔
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {orders.length === 0 && (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📦</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "8px" }}>No orders placed yet</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
                Fragrant, steaming hot biryani is waiting for you!
              </p>
              <Link href="/menu">
                <button className="btn btn-primary" style={{ padding: "10px 24px" }}>
                  Browse Menu 🍛
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
