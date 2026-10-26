import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about delivery zones, payment options (COD, JazzCash, Easypaisa, Cards), and order tracking at Delivery Platform.",
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
