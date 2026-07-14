"use client";

/**
 * useOrderAlerts — REQ-ORDER-ALERT-001
 *
 * Full implementation:
 *   - Listens for order:new → starts alert loop, increments pendingCount
 *   - Listens for order:accepted / order:rejected / order:cancelled →
 *       decrements pendingCount; stops loop when pendingCount reaches 0
 *   - On socket reconnect: fetches PENDING orders from API → restarts loop if needed
 *   - Browser Notification API (if permitted)
 *   - Tab title updates: "(N) New Orders — Naseeb Admin"
 *   - Exposes pendingCount, pendingOrders[], latestOrder for UI consumption
 *   - Multi-admin sync: events from backend broadcast to ALL admin room members
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSoundSystem } from "./useSoundSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  itemsCount: number;
  paymentMethod: string;
  placedAt: string;
}

// ─── Browser Notification helper ──────────────────────────────────────────────

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showBrowserNotification(order: PendingOrder) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification("🔴 New Order Received", {
      body: `Order #${order.orderNumber}\n${order.itemsCount} item(s) — Rs. ${order.total}`,
      icon: "/favicon.ico",
      tag: `order-${order.orderId}`, // deduplicated by tag
      requireInteraction: true,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/dashboard/orders`;
      n.close();
    };
  } catch {
    // Notification API may be blocked — silent fail
  }
}

// ─── Tab title management ─────────────────────────────────────────────────────

const ORIGINAL_TITLE = "Naseeb Admin";

function setTabTitle(count: number) {
  if (typeof document === "undefined") return;
  document.title = count > 0 ? `(${count}) New Orders — ${ORIGINAL_TITLE}` : ORIGINAL_TITLE;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseOrderAlertsOptions {
  onNewOrder?: (order: PendingOrder) => void;
  onOrderResolved?: (orderId: string) => void;
}

export function useOrderAlerts(options: UseOrderAlertsOptions = {}) {
  const { socket, isConnected } = useSocket();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [latestOrder, setLatestOrder] = useState<PendingOrder | null>(null);
  const pendingCountRef = useRef(0);
  const hasRequestedPermission = useRef(false);

  const { playOrderAlert, stopOrderAlert, playPaymentSuccess, playPaymentFailed } = useSoundSystem({
    onError: (type, err) => {
      console.error(`[ALERT] Sound error (${type}):`, err);
      // Visual fallback: document title pulse
      if (type === "newOrder") {
        setTabTitle(pendingCountRef.current);
      }
    },
  });

  // ── Request browser notification permission once ───────────────────────────
  useEffect(() => {
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, []);

  // ── Sync pending orders from API after reconnect ──────────────────────────
  const syncPendingOrders = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("naseeb_token") : null;
    if (!token || token === "sandbox_demo_token") return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/owner/orders?status=PENDING`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const orders: PendingOrder[] = Array.isArray(data.data)
        ? data.data.map((o: any) => ({
            orderId: o.id,
            orderNumber: o.id,
            customerName: o.customer?.name || "Customer",
            total: o.total,
            itemsCount: o.orderItems?.length || 0,
            paymentMethod: o.paymentMethod,
            placedAt: o.placedAt,
          }))
        : Array.isArray(data)
        ? data.map((o: any) => ({
            orderId: o.id,
            orderNumber: o.id,
            customerName: o.customer?.name || "Customer",
            total: o.total,
            itemsCount: o.orderItems?.length || 0,
            paymentMethod: o.paymentMethod,
            placedAt: o.placedAt,
          }))
        : [];

      if (orders.length > 0) {
        setPendingOrders(orders);
        pendingCountRef.current = orders.length;
        setTabTitle(orders.length);
        playOrderAlert();
      }
    } catch {
      // Silent — no crash on sync failure
    }
  }, [playOrderAlert]);

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // ── order:new ────────────────────────────────────────────────────────────
    const handleNewOrder = (data: PendingOrder) => {
      setPendingOrders((prev) => {
        if (prev.find((o) => o.orderId === data.orderId)) return prev;
        return [data, ...prev];
      });

      pendingCountRef.current += 1;
      setLatestOrder(data);
      setTabTitle(pendingCountRef.current);

      // Start loop — safe to call when already looping (does nothing)
      playOrderAlert();

      // Browser notification
      showBrowserNotification(data);

      options.onNewOrder?.(data);
    };

    // ── Order resolved (accepted / rejected / cancelled) ──────────────────────
    const handleOrderResolved = (data: { orderId: string; status: string }) => {
      setPendingOrders((prev) => {
        const next = prev.filter((o) => o.orderId !== data.orderId);
        pendingCountRef.current = next.length;
        setTabTitle(next.length);

        // Stop loop only when ALL pending orders are acknowledged
        if (next.length === 0) {
          stopOrderAlert();
        }

        return next;
      });

      options.onOrderResolved?.(data.orderId);
    };

    // ── payment:success ───────────────────────────────────────────────────────
    const handlePaymentSuccess = () => {
      playPaymentSuccess();
    };

    // ── payment:failed ────────────────────────────────────────────────────────
    const handlePaymentFailed = () => {
      playPaymentFailed();
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:accepted", handleOrderResolved);
    socket.on("order:rejected", handleOrderResolved);
    socket.on("order:cancelled", handleOrderResolved);
    socket.on("payment:success", handlePaymentSuccess);
    socket.on("payment:failed", handlePaymentFailed);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:accepted", handleOrderResolved);
      socket.off("order:rejected", handleOrderResolved);
      socket.off("order:cancelled", handleOrderResolved);
      socket.off("payment:success", handlePaymentSuccess);
      socket.off("payment:failed", handlePaymentFailed);
    };
  }, [socket, playOrderAlert, stopOrderAlert, playPaymentSuccess, playPaymentFailed, options]);

  // ── Reconnect → sync pending ───────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) {
      syncPendingOrders();
    }
  }, [isConnected, syncPendingOrders]);

  // ── Cleanup tab title on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      setTabTitle(0);
      stopOrderAlert();
    };
  }, [stopOrderAlert]);

  // ── Manual dismiss (for testing / admin action via UI) ────────────────────
  const dismissOrder = useCallback((orderId: string) => {
    setPendingOrders((prev) => {
      const next = prev.filter((o) => o.orderId !== orderId);
      pendingCountRef.current = next.length;
      setTabTitle(next.length);
      if (next.length === 0) stopOrderAlert();
      return next;
    });
  }, [stopOrderAlert]);

  const dismissAll = useCallback(() => {
    setPendingOrders([]);
    pendingCountRef.current = 0;
    setTabTitle(0);
    stopOrderAlert();
  }, [stopOrderAlert]);

  return {
    pendingOrders,
    pendingCount: pendingOrders.length,
    latestOrder,
    dismissOrder,
    dismissAll,
  };
}
