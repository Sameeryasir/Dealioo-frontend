import {
  CAMPAIGN_DASHBOARD_TABS,
  type CampaignDashboardTabId,
} from "@/app/lib/campaign-dashboard-tab";
import { hasAnyAutomationPermission } from "@/app/lib/member-permissions";
import type { BusinessMemberPermission } from "@/app/services/member/types";

export function parseCampaignHeaderPrice(
  raw: number | string | undefined,
): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatCampaignHeaderPrice(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

export function getVisibleCampaignHeaderTabs(options: {
  isOwnerLike: boolean;
  can: (permission: BusinessMemberPermission | "google_ads") => boolean;
  permissionList: string[] | null | undefined;
}): Array<(typeof CAMPAIGN_DASHBOARD_TABS)[number]> {
  const { isOwnerLike, can, permissionList } = options;
  return CAMPAIGN_DASHBOARD_TABS.filter(({ id }) => {
    if (isOwnerLike || id === "overview") return true;
    const tabAccess: Record<CampaignDashboardTabId, boolean> = {
      overview: true,
      guests: can("campaigns_guests"),
      orders: can("campaigns_orders"),
      funnel: can("funnels_edit"),
      automations: hasAnyAutomationPermission(permissionList ?? []),
    };
    return tabAccess[id];
  });
}
