import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MenuItem, CartItem } from "../types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  deliveryFee: number;
  total: number;
  addItem: (item: MenuItem, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "@naseeb_cart";
const FIXED_DELIVERY_FEE = 50;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch {}
    }
    loadCart();
  }, []);

  // Save cart on changes
  const saveCart = async (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  };

  const addItem = useCallback((item: MenuItem, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        updated = [...prev, { id: `cart-${Date.now()}`, menuItem: item, quantity: qty }];
      }
      saveCart(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.menuItem.id !== id);
      saveCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.menuItem.id === id ? { ...i, quantity: qty } : i
      );
      saveCart(updated);
      return updated;
    });
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const deliveryFee = items.length > 0 ? FIXED_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice: subtotal,
        deliveryFee,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
