import { api } from '../../../common/lib/api';
import {
  listNotifications as _listNotifications,
  markNotificationRead as _markNotificationRead,
  markAllNotificationsRead as _markAllNotificationsRead,
} from '@ipm/shared';

export type { NotificationDto, NotificationsResponse } from '@ipm/shared';

export const listNotifications = () => _listNotifications(api);
export const markNotificationRead = (id: number) => _markNotificationRead(api, id);
export const markAllNotificationsRead = () => _markAllNotificationsRead(api);
