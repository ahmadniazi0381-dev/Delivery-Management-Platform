"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { GoogleMapsProvider } from "@/context/GoogleMapsContext";

function googleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientId = googleClientId();

  const tree = (
    <AuthProvider>
      <GoogleMapsProvider>
        <SocketProvider>
          <CartProvider>{children}</CartProvider>
        </SocketProvider>
      </GoogleMapsProvider>
    </AuthProvider>
  );

  // Provider requires a non-empty clientId; skip wrap when unset (dev without Google)
  if (!clientId) return tree;

  return <GoogleOAuthProvider clientId={clientId}>{tree}</GoogleOAuthProvider>;
}
