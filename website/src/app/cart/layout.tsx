import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Shopping Cart",
  description: "Review your selected items, apply promotional discount coupons, and proceed to checkout at Delivery Platform.",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
