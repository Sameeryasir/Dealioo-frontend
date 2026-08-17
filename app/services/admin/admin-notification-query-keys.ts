import type { AdminNotificationStatus } from "@/app/services/admin/get-admin-notifications";

export const adminNotificationQueryKeys = {
  all: ["admin-notifications"] as const,
  unreadCount: ["admin-notifications", "unread-count"] as const,
  list: (status: AdminNotificationStatus) =>
    [...adminNotificationQueryKeys.all, "list", status] as const,
};
