"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminLayout from "@/features/admin/AdminLayout";
import RiderLayout from "@/features/rider/RiderLayout";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const isAdminRoute = pathname.startsWith("/dashboard");
  const isRiderRoute = pathname.startsWith("/rider");
  const isCheckoutRoute = pathname === "/checkout";

  useEffect(() => {
    if (isLoading) return;

    if (isAdminRoute) {
      if (!token) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== "ADMIN") {
        router.push("/");
      }
    } else if (isRiderRoute) {
      if (!token) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (user?.role !== "RIDER") {
        router.push("/");
      }
    } else if (isCheckoutRoute) {
      // Admins and Riders cannot access the checkout screen
      if (user?.role === "ADMIN") {
        router.push("/dashboard");
      } else if (user?.role === "RIDER") {
        router.push("/rider");
      }
    }
  }, [isLoading, token, user, pathname, isAdminRoute, isRiderRoute, isCheckoutRoute, router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--saffron)", animation: "spin 1s linear infinite" }} />
          <style jsx global>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <span>Loading Naseeb Baryani...</span>
        </div>
      </div>
    );
  }

  // Render Admin Layout
  if (isAdminRoute) {
    if (user?.role !== "ADMIN") {
      return null; // Prevents flashing dashboard before redirect triggers
    }
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Render Rider Layout
  if (isRiderRoute) {
    if (user?.role !== "RIDER") {
      return null; // Prevents flashing rider dashboard before redirect triggers
    }
    return <RiderLayout>{children}</RiderLayout>;
  }

  // Render standard Customer/Guest Layout
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Navbar />
      <main id="main-content" className="flex-1 page-offset">{children}</main>
      <Footer />
    </>
  );
}
