import type { AxiosInstance } from 'axios';
import type { NotificationsResponse } from '../types/index.js';

export async function listNotifications(api: AxiosInstance): Promise<NotificationsResponse> {
  const res = await api.get<NotificationsResponse>('/notifications');
  return res.data;
}

export async function markNotificationRead(api: AxiosInstance, id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(api: AxiosInstance): Promise<void> {
  await api.patch('/notifications/read-all');
}
