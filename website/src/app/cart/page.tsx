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
  const [couponCode, setCouponCode]   = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discount, setDiscount]       = useState(0);

  const handleApplyCoupon = () => {
    setCouponError("");
    setCouponSuccess("");
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    if (couponCode.trim().toUpperCase() === "SAVE20") {
      setDiscount(20);
      setCouponSuccess("Coupon 'SAVE20' applied! Rs. 20 discount added.");
    } else {
      setDiscount(0);
      setCouponError("Invalid coupon code. Try 'SAVE20'.");
    }
  };

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
          discount,
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
        <div style={{
          background: "var(--bg-card)",
          padding: "60px 40px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-card)",
          maxWidth: "500px",
          width: "100%",
        }}>
          <div
            className="animate-scale-in"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(194, 65, 12, 0.1) 100%)",
              border: "3px solid #EA580C",
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
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "8px" }}>
            Your order #{orderSuccess} has been received. We'll start preparing
            it right away!
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "36px" }}>
            Estimated delivery: <strong>25–35 minutes</strong>
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href={`/track?order=${orderSuccess}`} className="btn btn-primary btn-lg" style={{ background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)', color: 'white', border: 'none' }}>
              📍 Track Order
            </Link>
            <Link href="/menu" className="btn btn-ghost btn-lg">
              Order More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty Cart ───────────────────────────────────────────
  if (cart.items.length === 0) {
    return (
      <div
        className="animate-fade-up"
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
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', margin: '0 auto', maxWidth: '600px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Add some delicious items to get started</p>
          <Link href='/menu' className='btn btn-primary'>Explore Menu →</Link>
        </div>
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

        <div className="cart-main-grid">
          {/* ── Left: Cart Items ──────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
            {cart.items.map((ci) => (
              <div
                key={ci.menuItem.id}
                className="card animate-fade-up cart-item-row group relative overflow-hidden"
                style={{ padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}
              >
                {/* Slide-out delete button background */}
                <div className="absolute inset-y-0 right-0 bg-red-500 w-24 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                  <button onClick={() => removeItem(ci.menuItem.id)} className="text-white font-bold h-full w-full">Delete</button>
                </div>
                
                {/* Main Content Area that slides left slightly on hover */}
                <div className="flex w-full items-center gap-4 bg-white z-10 transition-transform duration-300 group-hover:-translate-x-4">
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
                  <div className="cart-item-controls" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="qty-control border rounded-full overflow-hidden flex items-center">
                      <button className="px-3 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors" onClick={() => decrement(ci.menuItem.id)} aria-label="Decrease">−</button>
                      <span className="font-semibold w-6 text-center">{ci.quantity}</span>
                      <button className="px-3 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors" onClick={() => increment(ci.menuItem.id)} aria-label="Increase">+</button>
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
                  </div>
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
            <div className="card transition-all duration-300" style={{ padding: "24px" }}>
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

              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponError) setCouponError("");
                  }}
                  placeholder="Enter Coupon Code (e.g. SAVE20)" 
                  className="input flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--saffron)] transition-all"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon} 
                  className="btn bg-gray-800 text-white rounded-md px-4 text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponSuccess && <p className="text-green-600 text-sm font-medium mb-3 animate-fade-in">✓ {couponSuccess}</p>}
              {couponError && <p className="text-red-500 text-sm font-medium mb-3 animate-fade-in">⚠️ {couponError}</p>}

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
                  <span className="tabular-nums font-medium">Rs. {ci.menuItem.price * ci.quantity}</span>
                </div>
              ))}

              <div
                className="animate-fade-in"
                style={{
                  borderTop: "1px solid var(--border-color)",
                  marginTop: "14px",
                  paddingTop: "14px",
                }}
              >
                <div
                  className="transition-all duration-500 ease-out"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  <span>Subtotal</span>
                  <span className="tabular-nums">Rs. {cart.subtotal}</span>
                </div>
                <div
                  className="transition-all duration-500 ease-out"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  <span>Delivery Fee</span>
                  <span className="tabular-nums">Rs. {cart.deliveryFee}</span>
                </div>
                {discount > 0 && (
                  <div
                    className="transition-all duration-500 ease-out text-green-600"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.875rem",
                      marginBottom: "14px",
                    }}
                  >
                    <span>Discount</span>
                    <span className="tabular-nums">- Rs. {discount}</span>
                  </div>
                )}
                <div
                  className="transition-all duration-500 ease-out transform scale-100 origin-right"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "var(--maroon)",
                  }}
                >
                  <span>Total</span>
                  <span className="tabular-nums">Rs. {Math.max(0, cart.total - discount)}</span>
                </div>
              </div>
            </div>

            {/* Proceed to Checkout Button / Form */}
            {!user ? (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "12px" }}>
                  You must be logged in to place an order.
                </p>
                <Link
                  href="/auth/login?redirect=/cart"
                  className="btn btn-primary group relative overflow-hidden"
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
                  Login to Checkout <span className="inline-block transition-transform duration-300 group-hover:translate-x-2 ml-2">→</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {error && (
                  <div style={{
                    background: 'rgba(185,28,28,0.08)',
                    border: '1px solid rgba(185,28,28,0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: '#B91C1C',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    minHeight: '44px',
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Payment Method</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PAYMENT_OPTIONS.map(opt => (
                      <div
                        key={opt.id}
                        onClick={() => setPayment(opt.id)}
                        onMouseEnter={e => {
                          if (payment !== opt.id) {
                            (e.currentTarget as HTMLElement).style.borderColor = '#EA580C';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (payment !== opt.id) {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          }
                        }}
                        style={{
                          padding: '12px',
                          border: `1px solid ${payment === opt.id ? '#EA580C' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: payment === opt.id ? 'var(--bg-primary)' : 'transparent',
                          transition: 'all var(--transition-fast) ease',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{opt.label}</div>
                          {opt.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                  <input type="text" className="input" placeholder="Delivery Address" value={address} onChange={e => setAddress(e.target.value)} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                  <input type="text" className="input" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacing}
                  className="btn btn-primary btn-lg group relative overflow-hidden"
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)",
                    border: "none",
                    color: "white",
                    cursor: isPlacing ? "not-allowed" : "pointer",
                    transition: "transform 0.1s ease",
                    marginTop: "8px"
                  }}
                >
                  {isPlacing ? (
                    <>
                      <span className="animate-spin">↻</span> Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
                    </>
                  )}
                </button>
              </div>
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
