import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order History",
  description: "View past and ongoing orders, receipts, and order statuses with Delivery Platform.",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
