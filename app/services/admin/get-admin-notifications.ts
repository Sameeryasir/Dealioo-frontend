import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminNotificationItem = {
  id: string;
  type: string;
  eventKey: string;
  title: string;
  body: string;
  severity: string;
  actionUrl: string | null;
  resourceType: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type AdminNotificationsResponse = {
  unreadCount: number;
  items: AdminNotificationItem[];
};

export async function getAdminNotifications(): Promise<AdminNotificationsResponse> {
  try {
    const { data } = await authAxios.get<AdminNotificationsResponse>(
      "/admin/notifications",
    );
    return {
      unreadCount: Number(data?.unreadCount) || 0,
      items: Array.isArray(data?.items) ? data.items : [],
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load admin notifications."),
    );
  }
}
