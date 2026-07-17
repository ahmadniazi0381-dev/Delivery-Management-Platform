import { apiGet } from '../api/client';
import { MenuItem, Category } from '../types';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export const MenuService = {
  async getCategories(): Promise<Category[]> {
    const res = await apiGet<any>('/menu/categories');
    return res?.data || res || [];
  },

  async getMenuItems(params?: { categoryId?: string; featured?: boolean; search?: string }): Promise<MenuItem[]> {
    const query: Record<string, string> = {};
    if (params?.categoryId) query.categoryId = params.categoryId;
    if (params?.featured) query.featured = 'true';
    if (params?.search) query.search = params.search;
    const qs = new URLSearchParams(query).toString();
    const res = await apiGet<any>(`/menu${qs ? '?' + qs : ''}`);
    return res?.data || res || [];
  },

  async getFeaturedItems(): Promise<MenuItem[]> {
    return MenuService.getMenuItems({ featured: true });
  },

  async getBanners(): Promise<Banner[]> {
    try {
      const res = await apiGet<any>('/menu/banners');
      return res?.data || res || [];
    } catch { return []; }
  },
};
