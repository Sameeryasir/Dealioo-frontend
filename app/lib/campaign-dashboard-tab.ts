export const CAMPAIGN_DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "orders", label: "Orders" },
  { id: "funnel", label: "Funnel" },
  { id: "automations", label: "Automations" },
] as const;

export type CampaignDashboardTabId =
  (typeof CAMPAIGN_DASHBOARD_TABS)[number]["id"];

export function campaignDashboardHref(
  businessId: number,
  campaignId: number,
  tab: CampaignDashboardTabId = "overview",
): string {
  const base = `/business/${businessId}/dashboard/campaigns/${campaignId}`;
  if (tab === "overview") return base;
  return `${base}/${tab}`;
}

export function campaignDashboardTabFromPathname(
  pathname: string,
  businessId: number,
  campaignId: number,
): CampaignDashboardTabId {
  const base = campaignDashboardHref(businessId, campaignId);
  if (!pathname.startsWith(base)) return "overview";
  const rest = pathname.slice(base.length).replace(/^\//, "").split("/")[0] ?? "";
  if (rest === "guests") return "guests";
  if (rest === "orders") return "orders";
  if (rest === "funnel") return "funnel";
  if (rest === "automations") return "automations";
  return "overview";
}
