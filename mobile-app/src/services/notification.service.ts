import { apiGet, apiPost, apiPut } from '../api/client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const NotificationService = {
  async registerPushToken(token: string): Promise<void> {
    try {
      await apiPost('/auth/push-token', { token });
    } catch (e) {
      console.warn('Failed to register push token:', e);
    }
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await apiGet<any>('/notifications');
    return res?.data || res || [];
  },

  async markAsRead(id: string): Promise<void> {
    await apiPut(`/notifications/${id}/read`, {});
  },

  async markAllRead(): Promise<void> {
    await apiPut('/notifications/read-all', {});
  },
};
