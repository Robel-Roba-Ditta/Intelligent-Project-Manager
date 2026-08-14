import { api } from './api';

export interface NotificationDto {
  id: number;
  userId: number;
  taskId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task: { id: number; title: string } | null;
}

export interface NotificationsResponse {
  notifications: NotificationDto[];
  unreadCount: number;
}

export async function listNotifications(): Promise<NotificationsResponse> {
  const res = await api.get<NotificationsResponse>('/notifications');
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
