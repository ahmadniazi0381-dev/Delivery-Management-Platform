import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with secure delivery address verification and payment choices (Cash on Delivery, JazzCash, Easypaisa, Cards).",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
