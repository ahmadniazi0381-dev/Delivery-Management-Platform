import { useState, useEffect, useCallback } from 'react';
import { MenuService } from '../services/menu.service';
import { MenuItem, Category } from '../types';

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, menuItems] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getMenuItems(),
      ]);
      setCategories(cats);
      setItems(menuItems);
    } catch (e: any) {
      setError(e.message || 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return { categories, items, loading, error, refetch: fetchMenu };
}

export function useMenuByCategory(categoryId?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        const menuItems = await MenuService.getMenuItems({ categoryId });
        setItems(menuItems);
      } catch (e: any) {
        setError(e.message || 'Failed to load items');
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [categoryId]);

  return { items, loading, error };
}

export function useMenuItem(id: string) {
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchItem() {
      setLoading(true);
      setError(null);
      try {
        const menuItems = await MenuService.getMenuItems();
        const found = menuItems.find((i) => i.id === id);
        setItem(found || null);
      } catch (e: any) {
        setError(e.message || 'Failed to load menu item');
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  return { item, loading, error };
}
