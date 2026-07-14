"use client";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { GoogleMapsProvider } from "@/context/GoogleMapsContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GoogleMapsProvider>
        <SocketProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SocketProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  );
}
