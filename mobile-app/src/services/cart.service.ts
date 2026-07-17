import { apiGet, apiPost } from '../api/client';

export interface CouponResult {
  success: boolean;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  discountAmount: number;
  message?: string;
}

export interface DeliveryOptions {
  standardEnabled: boolean;
  standardFee: number;
  standardEta: string;
  priorityEnabled: boolean;
  priorityFee: number;
  priorityEta: string;
}

export const CartService = {
  async validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
    try {
      const res = await apiPost<any>('/discounts/validate', { code, subtotal });
      return res?.data || res;
    } catch (err: any) {
      // Fallback local validation if endpoint doesn't exist
      if (code.toUpperCase() === 'WELCOME10') {
        const discountAmount = subtotal * 0.1;
        return {
          success: true,
          code: 'WELCOME10',
          type: 'PERCENT',
          value: 10,
          discountAmount,
        };
      }
      return {
        success: false,
        code,
        type: 'PERCENT',
        value: 0,
        discountAmount: 0,
        message: err.message || 'Invalid coupon code',
      };
    }
  },

  async calculateDelivery(addressId: string): Promise<DeliveryOptions> {
    try {
      const res = await apiGet<any>(`/delivery/calculate?addressId=${addressId}`);
      return res?.data || res;
    } catch {
      // Fallback default delivery options
      return {
        standardEnabled: true,
        standardFee: 50,
        standardEta: '25-35 mins',
        priorityEnabled: true,
        priorityFee: 120,
        priorityEta: '15-20 mins',
      };
    }
  },
};
