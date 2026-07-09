import { isPositiveInt } from "@/app/lib/numbers";

const RESTAURANT_CAMPAIGNS_INDEX = /^\/restaurant\/\d+\/dashboard\/campaigns$/;

const RESTAURANT_CAMPAIGN_WORKSPACE =
  /^\/restaurant\/\d+\/dashboard\/campaigns\/\d+(?:\/.*)?$/;

/** e.g. /restaurant/14/dashboard/campaigns/14 */
const RESTAURANT_CAMPAIGN_IDS =
  /^\/restaurant\/(\d+)\/dashboard\/campaigns\/(\d+)(?:\/|$)/;

/** e.g. /restaurant/14/dashboard/automations */
const RESTAURANT_DASHBOARD_IDS = /^\/restaurant\/(\d+)\/dashboard(?:\/|$)/;

function parsePathSegmentId(value: string | undefined): number | undefined {
  if (value == null || !/^\d+$/.test(value)) return undefined;
  const n = Number.parseInt(value, 10);
  return isPositiveInt(n) ? n : undefined;
}

export type RestaurantDashboardPathIds = {
  restaurantId?: number;
  campaignId?: number;
};

export function parseBusinessDashboardPathIds(
  pathname: string,
): RestaurantDashboardPathIds {
  const campaignMatch = pathname.match(RESTAURANT_CAMPAIGN_IDS);
  if (campaignMatch) {
    return {
      restaurantId: parsePathSegmentId(campaignMatch[1]),
      campaignId: parsePathSegmentId(campaignMatch[2]),
    };
  }

  const dashboardMatch = pathname.match(RESTAURANT_DASHBOARD_IDS);
  if (dashboardMatch) {
    return { restaurantId: parsePathSegmentId(dashboardMatch[1]) };
  }

  return {};
}

const RESTAURANT_AUTOMATION_BUILDER =
  /^\/restaurant\/\d+\/dashboard\/automations\/[^/]+$/;

export function isRestaurantCampaignsIndex(pathname: string): boolean {
  return RESTAURANT_CAMPAIGNS_INDEX.test(pathname);
}

export function isRestaurantCampaignWorkspace(pathname: string): boolean {
  return RESTAURANT_CAMPAIGN_WORKSPACE.test(pathname);
}

export function isRestaurantAutomationBuilder(pathname: string): boolean {
  return RESTAURANT_AUTOMATION_BUILDER.test(pathname);
}

export function isRestaurantSidebarChromeMinimal(pathname: string): boolean {
  return (
    isRestaurantCampaignsIndex(pathname) ||
    isRestaurantCampaignWorkspace(pathname) ||
    isRestaurantAutomationBuilder(pathname)
  );
}
