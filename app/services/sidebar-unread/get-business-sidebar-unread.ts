import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { SidebarUnreadSection } from "@/app/lib/sidebar-section-unread-storage";

export type SidebarSectionUnreadResponse = {
  hasUnread: boolean;
  unreadCount: number;
  lastViewedAt: string | null;
  latestAt: string | null;
  latestDescription: string | null;
};

export type LatestGuestJoinedResponse = {
  customerId: number;
  guestName: string;
  guestEmail: string | null;
  campaignName: string | null;
  occurredAt: string;
};

export type LatestAccessUpdatedResponse = {
  businessName: string;
  previousRole: string;
  role: string;
  grantedPermissions: string[];
  removedPermissions: string[];
  updatedAt: string;
};

export type BusinessSidebarUnreadResponse = {
  orders: SidebarSectionUnreadResponse;
  activity: SidebarSectionUnreadResponse;
  history: SidebarSectionUnreadResponse;
  latestGuestJoined: LatestGuestJoinedResponse | null;
  latestAccessUpdated: LatestAccessUpdatedResponse | null;
};

function normalizeSection(
  value: Partial<SidebarSectionUnreadResponse> | null | undefined,
): SidebarSectionUnreadResponse {
  const unreadCount = Math.max(0, Math.floor(Number(value?.unreadCount) || 0));
  const latestDescription =
    typeof value?.latestDescription === "string" &&
    value.latestDescription.trim()
      ? value.latestDescription.trim()
      : null;
  return {
    hasUnread: Boolean(value?.hasUnread) || unreadCount > 0,
    unreadCount,
    lastViewedAt:
      typeof value?.lastViewedAt === "string" ? value.lastViewedAt : null,
    latestAt: typeof value?.latestAt === "string" ? value.latestAt : null,
    latestDescription: unreadCount > 0 ? latestDescription : null,
  };
}

function normalizePermissionList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const key = item.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function normalizeLatestGuestJoined(
  value: Partial<LatestGuestJoinedResponse> | null | undefined,
): LatestGuestJoinedResponse | null {
  if (!value || typeof value !== "object") return null;
  const customerId = Number(value.customerId);
  const guestName =
    typeof value.guestName === "string" ? value.guestName.trim() : "";
  const occurredAt =
    typeof value.occurredAt === "string" ? value.occurredAt.trim() : "";
  if (
    !Number.isFinite(customerId) ||
    customerId < 1 ||
    !guestName ||
    !occurredAt
  ) {
    return null;
  }
  return {
    customerId,
    guestName,
    guestEmail:
      typeof value.guestEmail === "string" && value.guestEmail.trim()
        ? value.guestEmail.trim()
        : null,
    campaignName:
      typeof value.campaignName === "string" && value.campaignName.trim()
        ? value.campaignName.trim()
        : null,
    occurredAt,
  };
}

function normalizeLatestAccessUpdated(
  value: Partial<LatestAccessUpdatedResponse> | null | undefined,
): LatestAccessUpdatedResponse | null {
  if (!value || typeof value !== "object") return null;
  const businessName =
    typeof value.businessName === "string" ? value.businessName.trim() : "";
  const role = typeof value.role === "string" ? value.role.trim() : "";
  const updatedAt =
    typeof value.updatedAt === "string" ? value.updatedAt.trim() : "";
  if (!businessName || !role || !updatedAt) return null;
  return {
    businessName,
    previousRole:
      typeof value.previousRole === "string" ? value.previousRole : "",
    role,
    grantedPermissions: normalizePermissionList(value.grantedPermissions),
    removedPermissions: normalizePermissionList(value.removedPermissions),
    updatedAt,
  };
}

export async function getBusinessSidebarUnread(
  businessId: number,
): Promise<BusinessSidebarUnreadResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/sidebar-unread/business/${encodeURIComponent(String(businessId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load sidebar unread state."),
    );
  }

  const raw = (await res.json()) as BusinessSidebarUnreadResponse;
  return {
    orders: normalizeSection(raw.orders),
    activity: normalizeSection(raw.activity),
    history: normalizeSection(raw.history),
    latestGuestJoined: normalizeLatestGuestJoined(raw.latestGuestJoined),
    latestAccessUpdated: normalizeLatestAccessUpdated(raw.latestAccessUpdated),
  };
}

export async function getSidebarSectionUnread(
  businessId: number,
  section: SidebarUnreadSection,
): Promise<SidebarSectionUnreadResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/sidebar-unread/business/${encodeURIComponent(String(businessId))}/${encodeURIComponent(section)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load section unread state."),
    );
  }

  return normalizeSection(
    (await res.json()) as SidebarSectionUnreadResponse,
  );
}

export async function markAccessNotifyRead(
  businessId: number,
): Promise<void> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/sidebar-unread/business/${encodeURIComponent(String(businessId))}/access-notify/mark-read`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not clear access notification."),
    );
  }
}
