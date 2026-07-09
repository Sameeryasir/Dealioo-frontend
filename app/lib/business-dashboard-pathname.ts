import { isPositiveInt } from "@/app/lib/numbers";

const BUSINESS_CAMPAIGNS_INDEX = /^\/business\/\d+\/dashboard\/campaigns$/;

const BUSINESS_CAMPAIGN_WORKSPACE =
  /^\/business\/\d+\/dashboard\/campaigns\/\d+(?:\/.*)?$/;

/** e.g. /business/14/dashboard/campaigns/14 */
const BUSINESS_CAMPAIGN_IDS =
  /^\/business\/(\d+)\/dashboard\/campaigns\/(\d+)(?:\/|$)/;

/** e.g. /business/14/dashboard/automations */
const BUSINESS_DASHBOARD_IDS = /^\/business\/(\d+)\/dashboard(?:\/|$)/;

function parsePathSegmentId(value: string | undefined): number | undefined {
  if (value == null || !/^\d+$/.test(value)) return undefined;
  const n = Number.parseInt(value, 10);
  return isPositiveInt(n) ? n : undefined;
}

export type BusinessDashboardPathIds = {
  businessId?: number;
  campaignId?: number;
};

/** @deprecated Use BusinessDashboardPathIds */
export type RestaurantDashboardPathIds = BusinessDashboardPathIds;

export function parseBusinessDashboardPathIds(
  pathname: string,
): BusinessDashboardPathIds {
  const normalized = pathname.replace(/^\/restaurant\//, "/business/");

  const campaignMatch = normalized.match(BUSINESS_CAMPAIGN_IDS);
  if (campaignMatch) {
    return {
      businessId: parsePathSegmentId(campaignMatch[1]),
      campaignId: parsePathSegmentId(campaignMatch[2]),
    };
  }

  const dashboardMatch = normalized.match(BUSINESS_DASHBOARD_IDS);
  if (dashboardMatch) {
    return { businessId: parsePathSegmentId(dashboardMatch[1]) };
  }

  return {};
}

const BUSINESS_AUTOMATION_BUILDER =
  /^\/business\/\d+\/dashboard\/automations\/[^/]+$/;

export function isBusinessCampaignsIndex(pathname: string): boolean {
  const normalized = pathname.replace(/^\/restaurant\//, "/business/");
  return BUSINESS_CAMPAIGNS_INDEX.test(normalized);
}

/** @deprecated Use isBusinessCampaignsIndex */
export const isRestaurantCampaignsIndex = isBusinessCampaignsIndex;

export function isBusinessCampaignWorkspace(pathname: string): boolean {
  const normalized = pathname.replace(/^\/restaurant\//, "/business/");
  return BUSINESS_CAMPAIGN_WORKSPACE.test(normalized);
}

/** @deprecated Use isBusinessCampaignWorkspace */
export const isRestaurantCampaignWorkspace = isBusinessCampaignWorkspace;

export function isBusinessAutomationBuilder(pathname: string): boolean {
  const normalized = pathname.replace(/^\/restaurant\//, "/business/");
  return BUSINESS_AUTOMATION_BUILDER.test(normalized);
}

/** @deprecated Use isBusinessAutomationBuilder */
export const isRestaurantAutomationBuilder = isBusinessAutomationBuilder;

export function isBusinessSidebarChromeMinimal(pathname: string): boolean {
  return (
    isBusinessCampaignsIndex(pathname) ||
    isBusinessCampaignWorkspace(pathname) ||
    isBusinessAutomationBuilder(pathname)
  );
}

/** @deprecated Use isBusinessSidebarChromeMinimal */
export const isRestaurantSidebarChromeMinimal = isBusinessSidebarChromeMinimal;
