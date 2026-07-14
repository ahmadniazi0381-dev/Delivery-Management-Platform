"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { MenuItem, CartItem, Cart } from "@/types";

// ── State ──────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: MenuItem }
  | { type: "REMOVE_ITEM"; payload: number | string }
  | { type: "INCREMENT"; payload: number | string }
  | { type: "DECREMENT"; payload: number | string }
  | { type: "CLEAR" }
  | { type: "LOAD"; payload: CartItem[] };

const DELIVERY_FEE = 60; // Rs. fixed delivery fee
const STORAGE_KEY = "naseeb_cart";

// ── Reducer ────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.menuItem.id === action.payload.id
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItem.id === action.payload.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { menuItem: action.payload, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.menuItem.id !== action.payload),
      };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.menuItem.id === action.payload
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };
    case "DECREMENT":
      return {
        items: state.items
          .map((i) =>
            i.menuItem.id === action.payload
              ? { ...i, quantity: i.quantity - 1 }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
    case "LOAD":
      return { items: action.payload };
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────
interface CartContextValue {
  cart: Cart;
  addItem: (item: MenuItem) => void;
  removeItem: (id: number | string) => void;
  increment: (id: number | string) => void;
  decrement: (id: number | string) => void;
  clearCart: () => void;
  getItemQty: (id: number | string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch({ type: "LOAD", payload: JSON.parse(stored) });
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const subtotal = useMemo(
    () =>
      state.items.reduce(
        (acc, i) => acc + i.menuItem.price * i.quantity,
        0
      ),
    [state.items]
  );

  const totalItems = useMemo(
    () => state.items.reduce((acc, i) => acc + i.quantity, 0),
    [state.items]
  );

  const cart: Cart = useMemo(
    () => ({
      items: state.items,
      totalItems,
      subtotal,
      deliveryFee: state.items.length > 0 ? DELIVERY_FEE : 0,
      total: state.items.length > 0 ? subtotal + DELIVERY_FEE : 0,
    }),
    [state.items, subtotal, totalItems]
  );

  const addItem = useCallback(
    (item: MenuItem) => dispatch({ type: "ADD_ITEM", payload: item }),
    []
  );
  const removeItem = useCallback(
    (id: number | string) => dispatch({ type: "REMOVE_ITEM", payload: id }),
    []
  );
  const increment = useCallback(
    (id: number | string) => dispatch({ type: "INCREMENT", payload: id }),
    []
  );
  const decrement = useCallback(
    (id: number | string) => dispatch({ type: "DECREMENT", payload: id }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const getItemQty = useCallback(
    (id: number | string) =>
      state.items.find((i) => i.menuItem.id === id)?.quantity ?? 0,
    [state.items]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        increment,
        decrement,
        clearCart,
        getItemQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
