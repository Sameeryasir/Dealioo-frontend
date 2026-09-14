import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_SIDEBAR_EVENT = {
  SECTION_UPDATED: "sidebar-section-updated",
} as const;

export function pusherBusinessSidebarChannel(businessId: number): string {
  return `private-business-sidebar-${businessId}`;
}

export type SidebarSectionUpdatedPusherPayload = {
  businessId: number;
  section: "orders" | "activity" | "history";
  occurredAt: string;
  actorUserId: number | null;
};

export function parseSidebarSectionUpdatedPayload(
  value: unknown,
): SidebarSectionUpdatedPusherPayload | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const businessId = Number(row.businessId);
  const section = row.section;
  const occurredAt =
    typeof row.occurredAt === "string" ? row.occurredAt : null;
  const actorRaw = row.actorUserId;
  const actorUserId =
    actorRaw == null || actorRaw === ""
      ? null
      : Number(actorRaw);

  if (
    !Number.isFinite(businessId) ||
    businessId < 1 ||
    (section !== "orders" &&
      section !== "activity" &&
      section !== "history") ||
    !occurredAt
  ) {
    return null;
  }

  return {
    businessId,
    section,
    occurredAt,
    actorUserId:
      actorUserId != null && Number.isFinite(actorUserId) && actorUserId > 0
        ? actorUserId
        : null,
  };
}
