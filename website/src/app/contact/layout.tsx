import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Delivery Platform. Call 0305 4311118 or send a message for catering, delivery support, and customer inquiries.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
