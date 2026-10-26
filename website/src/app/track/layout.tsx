import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Follow your order status in real time from kitchen preparation to rider dispatch and doorstep delivery.",
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
