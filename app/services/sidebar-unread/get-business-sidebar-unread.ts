import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { SidebarUnreadSection } from "@/app/lib/sidebar-section-unread-storage";

export type SidebarSectionUnreadResponse = {
  hasUnread: boolean;
  unreadCount: number;
  lastViewedAt: string | null;
};

export type BusinessSidebarUnreadResponse = {
  orders: SidebarSectionUnreadResponse;
  activity: SidebarSectionUnreadResponse;
  history: SidebarSectionUnreadResponse;
};

function normalizeSection(
  value: Partial<SidebarSectionUnreadResponse> | null | undefined,
): SidebarSectionUnreadResponse {
  const unreadCount = Math.max(0, Math.floor(Number(value?.unreadCount) || 0));
  return {
    hasUnread: Boolean(value?.hasUnread) || unreadCount > 0,
    unreadCount,
    lastViewedAt:
      typeof value?.lastViewedAt === "string" ? value.lastViewedAt : null,
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
