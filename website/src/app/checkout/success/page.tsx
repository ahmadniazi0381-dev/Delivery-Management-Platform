"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <main className="fp-checkout-page">
      <div className="fp-checkout-wrap">
        <div className="checkout-panel">
          <h1>Payment Successful</h1>
          <p>Your order has been placed and payment was verified.</p>
          {orderId ? (
            <Link href={`/track?orderId=${encodeURIComponent(orderId)}`} className="checkout-next">
              Track Order
            </Link>
          ) : (
            <Link href="/orders" className="checkout-next">
              View Orders
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
