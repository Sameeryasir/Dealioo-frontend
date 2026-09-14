import type { GuestJoinedPusherPayload } from "@/app/lib/pusher-guest-joined";

const STORAGE_PREFIX = "retention:guest-joined-notify:";
const DISMISSED_PREFIX = "retention:guest-joined-dismissed:";
export const GUEST_JOINED_NOTIFY_EVENT = "retention:guest-joined-notify";

export type GuestJoinedNotification = {
  businessId: number;
  customerId: number;
  guestName: string;
  guestEmail: string | null;
  campaignName: string | null;
  updatedAt: string;
};

function storageKey(userId: number, businessId: number): string {
  return `${STORAGE_PREFIX}${userId}:${businessId}`;
}

function dismissedKey(userId: number, businessId: number): string {
  return `${DISMISSED_PREFIX}${userId}:${businessId}`;
}

function emitChanged(businessId: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GUEST_JOINED_NOTIFY_EVENT, {
      detail: { businessId },
    }),
  );
}

function readDismissedAt(userId: number, businessId: number): string | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(dismissedKey(userId, businessId));
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function isGuestJoinedNewerThanDismissed(
  userId: number,
  businessId: number,
  occurredAt: string,
): boolean {
  const dismissedAt = readDismissedAt(userId, businessId);
  if (!dismissedAt) return true;
  const nextMs = Date.parse(occurredAt);
  const dismissedMs = Date.parse(dismissedAt);
  if (!Number.isFinite(nextMs)) return false;
  if (!Number.isFinite(dismissedMs)) return true;
  return nextMs > dismissedMs;
}

export function formatGuestJoinedBody(
  notify: Pick<GuestJoinedNotification, "guestName" | "campaignName">,
): string {
  const name = notify.guestName.trim() || "A guest";
  const campaign = notify.campaignName?.trim();
  if (campaign) {
    return `${name} joined via ${campaign}.`;
  }
  return `${name} joined as a new guest.`;
}

export function readGuestJoinedNotification(
  userId: number,
  businessId: number,
): GuestJoinedNotification | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(storageKey(userId, businessId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GuestJoinedNotification>;
    const businessIdValue = Number(parsed.businessId);
    const customerId = Number(parsed.customerId);
    if (
      !Number.isFinite(businessIdValue) ||
      businessIdValue < 1 ||
      !Number.isFinite(customerId) ||
      customerId < 1 ||
      typeof parsed.guestName !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    if (
      !isGuestJoinedNewerThanDismissed(
        userId,
        businessId,
        parsed.updatedAt,
      )
    ) {
      return null;
    }
    return {
      businessId: businessIdValue,
      customerId,
      guestName: parsed.guestName,
      guestEmail:
        typeof parsed.guestEmail === "string" && parsed.guestEmail.trim()
          ? parsed.guestEmail.trim()
          : null,
      campaignName:
        typeof parsed.campaignName === "string" && parsed.campaignName.trim()
          ? parsed.campaignName.trim()
          : null,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeGuestJoinedNotification(
  userId: number,
  payload: GuestJoinedPusherPayload | GuestJoinedNotification,
): void {
  if (typeof localStorage === "undefined") return;
  const occurredAt =
    "occurredAt" in payload
      ? payload.occurredAt
      : payload.updatedAt;
  if (
    !isGuestJoinedNewerThanDismissed(
      userId,
      payload.businessId,
      occurredAt,
    )
  ) {
    return;
  }
  const row: GuestJoinedNotification = {
    businessId: payload.businessId,
    customerId: payload.customerId,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    campaignName: payload.campaignName,
    updatedAt: occurredAt,
  };
  localStorage.setItem(
    storageKey(userId, payload.businessId),
    JSON.stringify(row),
  );
  emitChanged(payload.businessId);
}

export function clearGuestJoinedNotification(
  userId: number,
  businessId: number,
  occurredAt?: string | null,
): void {
  if (typeof localStorage === "undefined") return;
  let stamp =
    typeof occurredAt === "string" && occurredAt.trim()
      ? occurredAt.trim()
      : null;
  if (!stamp) {
    try {
      const raw = localStorage.getItem(storageKey(userId, businessId));
      if (raw) {
        const parsed = JSON.parse(raw) as { updatedAt?: string };
        if (typeof parsed.updatedAt === "string" && parsed.updatedAt.trim()) {
          stamp = parsed.updatedAt.trim();
        }
      }
    } catch {
    }
  }
  if (!stamp) {
    stamp = new Date().toISOString();
  }
  localStorage.removeItem(storageKey(userId, businessId));
  localStorage.setItem(dismissedKey(userId, businessId), stamp);
  emitChanged(businessId);
}
