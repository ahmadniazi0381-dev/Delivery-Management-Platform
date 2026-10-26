import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu & Deals",
  description: "Browse our menu featuring signature Karachi Biryani, fragrant Mutton & Beef Pulao, fresh Raita, and refreshing drinks ready for fast delivery.",
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
