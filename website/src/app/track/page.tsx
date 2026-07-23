"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Order, OrderStatus } from "@/types";
import { io } from "socket.io-client";

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string; description: string }[] = [
  { key: "pending",          label: "Order Placed",     icon: "âœ…", description: "Your order has been received." },
  { key: "confirmed",        label: "Confirmed",         icon: "ðŸ‘", description: "The restaurant confirmed your order." },
  { key: "preparing",        label: "Being Prepared",   icon: "ðŸ‘¨â€ðŸ³", description: "Our chefs are cooking your biryani fresh." },
  { key: "ready",            label: "Ready",             icon: "ðŸ“¦", description: "Order packed and ready for delivery." },
  { key: "out_for_delivery", label: "On the Way",        icon: "ðŸš´", description: "Rider is heading to your doorstep." },
  { key: "delivered",        label: "Delivered",         icon: "ðŸŽ‰", description: "Enjoy your meal! ðŸ˜Š" },
];

const MOCK_ORDER: Order = {
  id:            1247,
  status:        "preparing",
  totalAmount:   760,
  paymentMethod: "cash",
  createdAt:     new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  estimatedDelivery: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
  deliveryAddress: {
    label: "Home",
    street: "House 12, Street 5, Johar Town",
    area: "Near UCP",
    city: "Lahore",
    latitude: 31.4475,
    longitude: 74.2690,
  },
  items: [
    { menuItem: { id: 1, name: "Karachi Special Biryani", description: "", price: 380, categoryId: 1, isAvailable: true }, quantity: 1 },
    { menuItem: { id: 3, name: "Mutton Pulao",            description: "", price: 420, categoryId: 2, isAvailable: true }, quantity: 1 },
  ],
};

const statusMap: Record<string, OrderStatus> = {
  PENDING: "pending",
  ACCEPTED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REJECTED: "cancelled"
};

function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1)   return "just now";
  if (diff < 60)  return `${Math.floor(diff)} min ago`;
  return `${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m ago`;
}

function TrackContent() {
  const searchParams             = useSearchParams();
  const orderId                  = searchParams.get("order") || searchParams.get("orderId");
  const [orderIdInput, setInput] = useState(orderId ?? "");
  const [order,    setOrder]     = useState<Order | null>(null);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState("");

  const fetchOrder = async (id: string) => {
    if (!id.trim()) { setError("Please enter an order ID."); return; }
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("naseeb_token");
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data  = await res.json();
      if (data.success && data.data) {
        // Map backend order format to frontend types
        const raw = data.data;
        const mappedOrder: Order = {
          id: raw.id,
          status: statusMap[raw.status] || "pending",
          totalAmount: parseFloat(raw.total.toString()),
          paymentMethod: raw.paymentMethod ? raw.paymentMethod.toLowerCase() : "cash",
          createdAt: raw.placedAt,
          estimatedDelivery: raw.placedAt
            ? new Date(new Date(raw.placedAt).getTime() + (raw.estimatedDeliveryMinutes || 30) * 60 * 1000).toISOString()
            : undefined,
          deliveryAddress: {
            label: raw.address?.label || "Home",
            street: raw.address?.addressLine || "Johar Town, Lahore",
            area: "",
            city: "Lahore",
            latitude: raw.address?.latitude || 31.4475531,
            longitude: raw.address?.longitude || 74.2690347,
          },
          items: raw.orderItems ? raw.orderItems.map((item: any) => ({
            menuItem: {
              id: item.menuItemId,
              name: item.itemName,
              description: "",
              price: parseFloat(item.unitPrice.toString()),
              categoryId: 1,
              isAvailable: true
            },
            quantity: item.quantity
          })) : []
        };
        setOrder(mappedOrder);
      } else {
        setError("Order not found. Please check the ID.");
      }
    } catch {
      // Dev fallback with number ID matching
      setError("Failed to fetch order. Using simulated offline review.");
      setOrder({ ...MOCK_ORDER, id: isNaN(Number(id)) ? 1247 : Number(id) });
    } finally {
      setLoading(false);
    }
  };

  // Run on mount if orderId present
  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  // Set up socket listener for live updates
  useEffect(() => {
    if (!order) return;
    
    // Connect to websocket server
    const socket = io(process.env.NEXT_PUBLIC_API_URL!.replace("/api", ""));
    
    socket.on("connect", () => {
      console.log("Connected to WebSockets for live status updates.");
    });

    socket.on("order:status", (event: { orderId: string; status: string; paymentStatus?: string }) => {
      if (event.orderId === order.id.toString()) {
        setOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: statusMap[event.status] || prev.status,
          };
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [order?.id]);

  // Auto-poll every 30s as fallback if sockets disconnect
  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled") return;
    const interval = setInterval(() => fetchOrder(String(order.id)), 30000);
    return () => clearInterval(interval);
  }, [order?.id]);

  const activeStepIndex = order ? getStepIndex(order.status) : -1;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100vh", padding: "40px 0 80px" }}>
      <div className="container" style={{ maxWidth: "720px", margin: "0 auto", padding: "0 20px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div className="section-tag">ðŸ“ Order Tracking</div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: "1.875rem", color: "var(--text-primary)", marginTop: "8px" }}>
            Track Your Order
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>
            Enter your order ID or check the status of your current order.
          </p>
        </div>

        {/* Order ID Search */}
        <div
          className="card"
          style={{ padding: "24px", marginBottom: "24px" }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="input-group" style={{ flex: 1 }}>
              <span className="input-icon">ðŸ”¢</span>
              <input
                type="text"
                className="input"
                placeholder="Enter Order ID"
                value={orderIdInput}
                onChange={(e) => setInput(e.target.value)}
                id="order-id-input"
                onKeyDown={(e) => e.key === "Enter" && fetchOrder(orderIdInput)}
              />
            </div>
            <button
              onClick={() => fetchOrder(orderIdInput)}
              disabled={loading}
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
              id="track-btn"
            >
              {loading ? "â³" : "Track"}
            </button>
          </div>
          {error && (
            <p style={{ marginTop: "10px", fontSize: "0.875rem", color: "#DC2626" }}>
              âš ï¸ {error}
            </p>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Status Card */}
            <div
              className="card"
              style={{
                padding: "28px 24px",
                background: order.status === "delivered"
                  ? "linear-gradient(135deg, #14532D 0%, #166534 100%)"
                  : order.status === "cancelled"
                  ? "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)"
                  : "var(--grad-maroon)",
                color: "#FEF3C7",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Order #{order.id.toString().slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: "1.5rem", marginTop: "4px" }}>
                    {STATUS_STEPS.find(s => s.key === order.status)?.icon}{" "}
                    {STATUS_STEPS.find(s => s.key === order.status)?.label ?? order.status}
                  </div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.78, marginTop: "4px" }}>
                    {STATUS_STEPS.find(s => s.key === order.status)?.description}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#FBBF24" }}>
                    Rs. {order.totalAmount}
                  </div>
                  <div style={{ fontSize: "0.78rem", opacity: 0.65, marginTop: "2px" }}>
                    Placed {timeAgo(order.createdAt)}
                  </div>
                </div>
              </div>

              {/* ETA */}
              {order.estimatedDelivery && order.status !== "delivered" && order.status !== "cancelled" && (
                <div
                  style={{
                    background: "rgba(254,243,199,0.1)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>â±ï¸</span>
                  <span>
                    Estimated delivery by{" "}
                    <strong style={{ color: "#FBBF24" }}>
                      {formatTime(order.estimatedDelivery)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Progress Tracker */}
            <div className="card" style={{ padding: "28px 24px" }}>
              <h3
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  marginBottom: "28px",
                }}
              >
                Order Progress
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {STATUS_STEPS.filter(s => s.key !== "cancelled").map((step, i) => {
                  const isDone   = i <= activeStepIndex;
                  const isActive = i === activeStepIndex;
                  return (
                    <div
                      key={step.key}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        position: "relative",
                        flex: 1
                      }}
                    >
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isActive ? "var(--saffron)" : isDone ? "var(--saffron)" : "var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        boxShadow: isActive ? "var(--shadow-saffron)" : "none",
                        transition: "all var(--transition-base)"
                      }}>
                        {isDone ? step.icon : "â—‹"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          textAlign: "center",
                          color: isActive
                            ? "var(--saffron)"
                            : isDone
                            ? "var(--text-secondary)"
                            : "var(--text-muted)",
                          fontWeight: isActive ? 600 : 400,
                          maxWidth: "68px",
                        }}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="card" style={{ padding: "24px" }}>
              <h3
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Items Ordered
              </h3>
              {order.items.map((ci, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < order.items.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>ðŸ›</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        {ci.menuItem.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Qty: {ci.quantity}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 700,
                      color: "var(--maroon)",
                    }}
                  >
                    Rs. {ci.menuItem.price * ci.quantity}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "14px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-color)",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "var(--maroon)",
                }}
              >
                <span>Total Amount</span>
                <span>Rs. {order.totalAmount}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card" style={{ padding: "24px" }}>
              <h3
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                }}
              >
                ðŸ“ Delivery Address
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {order.deliveryAddress.street}
                {order.deliveryAddress.area && <><br />{order.deliveryAddress.area}</>}
                <br />
                {order.deliveryAddress.city}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/menu" className="btn btn-primary" style={{ textDecoration: "none" }}>
                ðŸ›’ Order Again
              </Link>
              <a
                href="tel:+923054311118"
                className="btn btn-ghost"
                style={{
                  border: "1px solid var(--border-color)",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.9rem"
                }}
              >
                📞 Call Muhammad Abdullah
              </a>
              <a
                href="https://wa.me/923054311118?text=Hello%20Muhammad%20Abdullah%2C%20I%20am%20inquiring%20about%20my%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{
                  border: "1px solid #25D366",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-md)",
                  color: "#16A34A",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                💬 WhatsApp Support
              </a>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!order && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>ðŸš´</div>
            <p>Enter your order ID above to track your delivery.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "var(--bg-secondary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>ðŸš´</div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading tracker...</p>
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}

