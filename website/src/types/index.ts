// Shared types for the customer website
export interface MenuItem {
  id: number | string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: number | string;
  category?: MenuCategory;
  isAvailable: boolean;
  inStock?: boolean;
  stockQuantity?: number | null;
  isFeatured?: boolean;
  isSpicy?: boolean;
  preparationTime?: number; // minutes
}

export interface MenuCategory {
  id: number | string;
  name: string;
  emoji: string;
  sortOrder: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface Address {
  id?: number;
  label: string;
  street: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export type StaffRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KDS';

export interface User {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  /** Canonical flag from API */
  phoneVerified?: boolean;
  /** Legacy alias used by some UI pages */
  isPhoneVerified?: boolean;
  addresses?: Address[];
  role?: "CUSTOMER" | "ADMIN" | "RIDER";
  /** RBAC staff role — only present for ADMIN users */
  staffRole?: StaffRole;
  /** Granular permission list derived from StaffProfile */
  permissions?: string[];
  mustChangePassword?: boolean;
}


export interface Order {
  id: number;
  status: OrderStatus;
  items: CartItem[];
  totalAmount: number;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
  estimatedDelivery?: string;
  trackingNotes?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod =
  | "cash"
  | "jazzcash"
  | "easypaisa"
  | "card";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface OtpPayload {
  phone: string;
  otp: string;
}
