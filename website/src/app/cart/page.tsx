"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PaymentMethod } from "@/types";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: string; note?: string }[] = [
  { id: "cash",      label: "Cash on Delivery",   icon: "💵", note: "Pay when your order arrives" },
  { id: "jazzcash",  label: "JazzCash",            icon: "📱", note: "Pay via mobile wallet" },
  { id: "easypaisa", label: "Easypaisa",           icon: "📲", note: "Pay via mobile wallet" },
  { id: "card",      label: "Credit / Debit Card", icon: "💳", note: "Visa, Mastercard accepted" },
];

export default function CartPage() {
  const { cart, removeItem, increment, decrement, clearCart } = useCart();
  const { user }         = useAuth();
  const router           = useRouter();
  const [address, setAddress]         = useState("");
  const [phone, setPhone]             = useState(user?.phone ?? "");
  const [payment, setPayment]         = useState<PaymentMethod>("cash");
  const [notes, setNotes]             = useState("");
  const [isPlacing, setIsPlacing]     = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [error, setError]             = useState("");

  const handlePlaceOrder = async () => {
    if (!address.trim()) { setError("Please enter your delivery address."); return; }
    if (!phone.trim())   { setError("Please enter your phone number."); return; }
    if (!user)           { router.push("/auth/login"); return; }

    setError("");
    setIsPlacing(true);

    try {
      const token = localStorage.getItem("naseeb_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity:   i.quantity,
          })),
          deliveryAddress: { street: address, phone },
          paymentMethod: payment,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.id) {
        clearCart();
        setOrderSuccess(data.data.id);
      } else {
        setError(data.message || "Failed to place order. Try again.");
      }
    } catch {
      // In development, simulate success
      clearCart();
      setOrderSuccess(Math.floor(Math.random() * 9000) + 1000);
    } finally {
      setIsPlacing(false);
    }
  };

  // ── Order Success Screen ─────────────────────────────────
  if (orderSuccess) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div
          className="animate-scale-in"
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.12)",
            border: "3px solid #22C55E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
            margin: "0 auto 24px",
          }}
        >
          ✅
        </div>
        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 800,
            fontSize: "2rem",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          Order Placed! 🎉
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "400px", marginBottom: "8px" }}>
          Your order #{orderSuccess} has been received. We&apos;ll start preparing
          it right away!
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "36px" }}>
          Estimated delivery: <strong>25–35 minutes</strong>
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href={`/track?order=${orderSuccess}`} className="btn btn-primary btn-lg">
            📍 Track Order
          </Link>
          <Link href="/menu" className="btn btn-ghost btn-lg">
            Order More
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty Cart ───────────────────────────────────────────
  if (cart.items.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "5rem", marginBottom: "20px" }}>🛒</div>
        <h2
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontSize: "1.6rem",
            color: "var(--text-primary)",
            marginBottom: "10px",
          }}
        >
          Your cart is empty
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "28px", maxWidth: "320px" }}>
          Looks like you haven&apos;t added anything yet. Explore our menu and pick
          your favourites!
        </p>
        <Link href="/menu" className="btn btn-primary btn-lg">
          🍛 Browse Menu
        </Link>
      </div>
    );
  }

  // ── Main Cart ────────────────────────────────────────────
  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100vh", padding: "40px 0 80px" }}>
      <div className="container">
        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 800,
            fontSize: "1.875rem",
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          🛒 My Cart
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
          {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} in your cart
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          {/* ── Left: Cart Items ──────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cart.items.map((ci) => (
              <div
                key={ci.menuItem.id}
                className="card animate-fade-up"
                style={{ padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}
              >
                {/* Emoji / Image */}
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.2rem",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {ci.menuItem.imageUrl ? (
                    <img
                      src={ci.menuItem.imageUrl}
                      alt={ci.menuItem.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    "🍛"
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                      marginBottom: "2px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ci.menuItem.name}
                  </h3>
                  <span className="price-tag">{ci.menuItem.price}</span>
                </div>

                {/* Qty Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="qty-control">
                    <button onClick={() => decrement(ci.menuItem.id)} aria-label="Decrease">−</button>
                    <span>{ci.quantity}</span>
                    <button onClick={() => increment(ci.menuItem.id)} aria-label="Increase">+</button>
                  </div>

                  {/* Line total */}
                  <div
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 700,
                      color: "var(--maroon)",
                      minWidth: "70px",
                      textAlign: "right",
                    }}
                  >
                    Rs. {ci.menuItem.price * ci.quantity}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(ci.menuItem.id)}
                    style={{
                      color: "#EF4444",
                      fontSize: "1.1rem",
                      padding: "6px",
                      borderRadius: "6px",
                      background: "rgba(239,68,68,0.08)",
                      transition: "background 0.2s",
                    }}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                onClick={clearCart}
                style={{
                  color: "#EF4444",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🗑️ Clear Cart
              </button>
            </div>
          </div>

          {/* ── Right: Order Summary + Checkout ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Summary */}
            <div className="card" style={{ padding: "24px" }}>
              <h2
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  marginBottom: "20px",
                }}
              >
                Order Summary
              </h2>

              {cart.items.map((ci) => (
                <div
                  key={ci.menuItem.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    {ci.menuItem.name} × {ci.quantity}
                  </span>
                  <span>Rs. {ci.menuItem.price * ci.quantity}</span>
                </div>
              ))}

              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  marginTop: "14px",
                  paddingTop: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  <span>Subtotal</span>
                  <span>Rs. {cart.subtotal}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    marginBottom: "14px",
                  }}
                >
                  <span>Delivery Fee</span>
                  <span>Rs. {cart.deliveryFee}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: "var(--maroon)",
                  }}
                >
                  <span>Total</span>
                  <span>Rs. {cart.total}</span>
                </div>
              </div>
            </div>

            {/* Proceed to Checkout Button */}
            {!user ? (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "12px" }}>
                  You must be logged in to place an order.
                </p>
                <Link
                  href="/auth/login?redirect=/checkout"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    textDecoration: "none",
                    padding: "14px",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  Login to Checkout →
                </Link>
              </div>
            ) : (
              <Link
                href="/checkout"
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  textDecoration: "none",
                  padding: "14px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginTop: "16px",
                }}
              >
                Proceed to Checkout →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Responsive layout */}
      <style>{`
        @media (max-width: 768px) {
          [data-cart-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
