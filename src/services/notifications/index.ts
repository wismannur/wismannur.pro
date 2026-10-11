import { getNotificationSummary, markAllNotificationsAsRead } from "./actions";
import type { NotificationEntityType, NotificationSummaryResponse } from "./types";

export interface NotificationService {
  getSummary(): Promise<NotificationSummaryResponse>;
  markAllAsRead(entityType?: NotificationEntityType): Promise<void>;
}

export const notificationService: NotificationService = {
  getSummary: getNotificationSummary,
  markAllAsRead: markAllNotificationsAsRead,
};

export * from "./types";
export * from "./actions";
