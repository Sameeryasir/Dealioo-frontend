import type { AdminNotificationStatus } from "@/app/services/admin/get-admin-notifications";

/** Separate cache keys so All and Unread pagination never mix. */
export const adminNotificationQueryKeys = {
  all: ["admin-notifications"] as const,
  list: (status: AdminNotificationStatus) =>
    [...adminNotificationQueryKeys.all, status] as const,
};
