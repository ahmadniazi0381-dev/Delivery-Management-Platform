import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your personal profile, phone verification, and saved delivery addresses with Delivery Platform.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
