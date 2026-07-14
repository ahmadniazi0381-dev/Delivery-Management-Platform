export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  phoneVerified: boolean;
  profilePicture?: string;
  loyaltyPoints?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isSpicy?: boolean;
  preparationTime?: number;
  rating?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

export interface Address {
  id: string;
  label: string; // "Home", "Work", etc.
  addressLine: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  placedAt: string;
  orderItems: OrderItem[];
  address: Address;
  customer?: User;
}

export interface OrderItem {
  id: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
