import { apiGet, apiPost } from '../api/client';
import { Order } from '../types';

export interface OrderDetail extends Order {
  internalNotes?: string;
  timeline?: {
    status: string;
    timestamp: string;
    description: string;
  }[];
}

export const OrderService = {
  async getOrders(): Promise<Order[]> {
    const res = await apiGet<any>('/orders');
    return res?.data || res || [];
  },

  async getOrderById(id: string): Promise<OrderDetail> {
    const res = await apiGet<any>(`/orders/${id}`);
    return res?.data || res;
  },

  async cancelOrder(id: string): Promise<void> {
    await apiPost(`/orders/${id}/cancel`, {});
  },

  async leaveReview(orderId: string, rating: number, comment: string): Promise<void> {
    await apiPost('/reviews', { orderId, rating, comment });
  },

  async reorderPrevious(orderId: string): Promise<any[]> {
    const res = await apiPost<any>(`/orders/${orderId}/reorder`, {});
    return res?.items || [];
  },
};
