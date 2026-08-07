import { isPusherConfigured } from "@/app/lib/pusher-execution";
import type { AdminNotificationItem } from "@/app/services/admin/get-admin-notifications";

export { isPusherConfigured };

export const PUSHER_ADMIN_NOTIFICATION_EVENT = {
  CREATED: "admin-notification-created",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherAdminNotificationsChannel(): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}admin-notifications`;
}

export function parseAdminNotificationPusherPayload(
  data: unknown,
): AdminNotificationItem | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const id = typeof row.id === "string" ? row.id.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const body = typeof row.body === "string" ? row.body : "";
  if (!id || !title) return null;

  return {
    id,
    type: typeof row.type === "string" ? row.type : "system",
    eventKey: typeof row.eventKey === "string" ? row.eventKey : "",
    title,
    body,
    severity: typeof row.severity === "string" ? row.severity : "info",
    actionUrl:
      row.actionUrl == null || row.actionUrl === ""
        ? null
        : String(row.actionUrl),
    resourceType:
      row.resourceType == null || row.resourceType === ""
        ? null
        : String(row.resourceType),
    resourceId:
      row.resourceId == null || row.resourceId === ""
        ? null
        : String(row.resourceId),
    isRead: Boolean(row.isRead),
    createdAt:
      typeof row.createdAt === "string" && row.createdAt.trim()
        ? row.createdAt
        : new Date().toISOString(),
  };
}
