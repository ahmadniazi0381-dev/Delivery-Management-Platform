import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline — Connection Lost",
  description: "You are currently offline. Please check your internet connection to continue ordering.",
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
