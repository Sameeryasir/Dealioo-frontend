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

export type AdminNotificationStatus = "read" | "unread";

export type AdminNotificationsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminNotificationsResponse = {
  unreadCount: number;
  items: AdminNotificationItem[];
  meta: AdminNotificationsMeta;
};

export async function getAdminNotifications(params?: {
  page?: number;
  limit?: number;
  status?: AdminNotificationStatus;
}): Promise<AdminNotificationsResponse> {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const status = params?.status ?? "read";
    const { data } = await authAxios.get<AdminNotificationsResponse>(
      "/admin/notifications",
      { params: { page, limit, status } },
    );
    const rawMeta = data?.meta;
    return {
      unreadCount: Number(data?.unreadCount) || 0,
      items: Array.isArray(data?.items) ? data.items : [],
      meta: {
        page: Number(rawMeta?.page) || page,
        limit: Number(rawMeta?.limit) || limit,
        total: Number(rawMeta?.total) || 0,
        totalPages: Number(rawMeta?.totalPages) || 0,
      },
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load admin notifications."),
    );
  }
}

export type MarkAdminNotificationReadResponse = {
  id: string;
  isRead: boolean;
  readAt: string | null;
  unreadCount: number;
};

export type MarkAllAdminNotificationsReadResponse = {
  updatedCount: number;
  unreadCount: number;
};

/** Marks one Super Admin notification as read. */
export async function markAdminNotificationRead(
  notificationId: string,
): Promise<MarkAdminNotificationReadResponse> {
  try {
    const { data } = await authAxios.patch<MarkAdminNotificationReadResponse>(
      `/admin/notifications/${notificationId}/read`,
    );
    return {
      id: String(data?.id ?? notificationId),
      isRead: Boolean(data?.isRead),
      readAt: data?.readAt ?? null,
      unreadCount: Number(data?.unreadCount) || 0,
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not mark notification as read."),
    );
  }
}

/** Marks every unread Super Admin notification as read. */
export async function markAllAdminNotificationsRead(): Promise<MarkAllAdminNotificationsReadResponse> {
  try {
    const { data } =
      await authAxios.patch<MarkAllAdminNotificationsReadResponse>(
        "/admin/notifications/read-all",
      );
    return {
      updatedCount: Number(data?.updatedCount) || 0,
      unreadCount: Number(data?.unreadCount) || 0,
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not mark all notifications as read."),
    );
  }
}
