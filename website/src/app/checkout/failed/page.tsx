"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutFailedPage() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId");
  const reason = params.get("reason") || params.get("code");

  return (
    <main className="fp-checkout-page">
      <div className="fp-checkout-wrap">
        <div className="checkout-panel">
          <h1>Payment Failed</h1>
          <p>{reason ? `Reason: ${reason}` : "Payment could not be completed."}</p>
          {sessionId && <p className="checkout-alert">Session: {sessionId}</p>}
          <Link href="/checkout" className="checkout-next">
            Try Again
          </Link>
        </div>
      </div>
    </main>
  );
}
