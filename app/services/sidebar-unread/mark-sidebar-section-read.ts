import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { SidebarUnreadSection } from "@/app/lib/sidebar-section-unread-storage";

export async function markSidebarSectionRead(
  businessId: number,
  section: SidebarUnreadSection,
): Promise<{ section: SidebarUnreadSection; lastViewedAt: string }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Invalid business id.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/sidebar-unread/business/${encodeURIComponent(String(businessId))}/${encodeURIComponent(section)}/mark-read`,
    { method: "POST" },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not mark section as read."),
    );
  }

  return (await res.json()) as {
    section: SidebarUnreadSection;
    lastViewedAt: string;
  };
}
