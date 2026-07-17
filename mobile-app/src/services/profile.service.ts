import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import { User, Address } from '../types';

export interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

export const ProfileService = {
  async getProfile(): Promise<User> {
    const res = await apiGet<any>('/profile');
    return res?.data || res;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await apiPut<any>('/profile', data);
    return res?.data || res;
  },

  async getAddresses(): Promise<Address[]> {
    const res = await apiGet<any>('/addresses');
    return res?.data || res || [];
  },

  async addAddress(data: Omit<Address, 'id'>): Promise<Address> {
    const res = await apiPost<any>('/addresses', data);
    return res?.data || res;
  },

  async updateAddress(id: string, data: Partial<Address>): Promise<Address> {
    const res = await apiPut<any>(`/addresses/${id}`, data);
    return res?.data || res;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiDelete(`/addresses/${id}`);
  },

  async getLoyaltyHistory(): Promise<LoyaltyTransaction[]> {
    const res = await apiGet<any>('/loyalty/history');
    return res?.data || res || [];
  },
};
