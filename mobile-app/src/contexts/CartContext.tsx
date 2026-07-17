import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MenuItem, CartItem } from "../types";
import { CartService, CouponResult, DeliveryOptions } from "../services/cart.service";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  couponCode: string;
  specialInstructions: string;
  selectedDeliveryType: 'STANDARD' | 'PRIORITY';
  deliveryOptions: DeliveryOptions;
  addItem: (item: MenuItem, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setSpecialInstructions: (notes: string) => void;
  setSelectedDeliveryType: (type: 'STANDARD' | 'PRIORITY') => void;
  loadDeliveryFees: (addressId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "@naseeb_cart";

const DEFAULT_DELIVERY_OPTIONS: DeliveryOptions = {
  standardEnabled: true,
  standardFee: 50,
  standardEta: '20-40 min',
  priorityEnabled: true,
  priorityFee: 125,
  priorityEta: '10-20 min',
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<'STANDARD' | 'PRIORITY'>('STANDARD');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>(DEFAULT_DELIVERY_OPTIONS);

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
    setCouponCode("");
    setCoupon(null);
    setSpecialInstructions("");
    setSelectedDeliveryType('STANDARD');
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

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    if (!code) return false;
    try {
      const res = await CartService.validateCoupon(code, subtotal);
      if (res.success) {
        setCoupon(res);
        setCouponCode(code);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponCode("");
  }, []);

  const loadDeliveryFees = useCallback(async (addressId: string) => {
    try {
      const fees = await CartService.calculateDelivery(addressId);
      setDeliveryOptions(fees);
    } catch {
      setDeliveryOptions(DEFAULT_DELIVERY_OPTIONS);
    }
  }, []);

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0;
    return selectedDeliveryType === 'PRIORITY'
      ? (deliveryOptions.priorityEnabled ? deliveryOptions.priorityFee : deliveryOptions.standardFee)
      : (deliveryOptions.standardEnabled ? deliveryOptions.standardFee : 0);
  }, [items, selectedDeliveryType, deliveryOptions]);

  const discountAmount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.type === 'PERCENT') {
      return subtotal * (coupon.value / 100);
    }
    return coupon.value;
  }, [coupon, subtotal]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + deliveryFee - discountAmount);
  }, [subtotal, deliveryFee, discountAmount]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalPrice: subtotal,
        deliveryFee,
        discountAmount,
        total,
        couponCode,
        specialInstructions,
        selectedDeliveryType,
        deliveryOptions,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        setSpecialInstructions,
        setSelectedDeliveryType,
        loadDeliveryFees,
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
