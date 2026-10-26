import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Login",
  description: "Sign in to your Delivery Platform account for faster checkout, order tracking, and exclusive discounts.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
