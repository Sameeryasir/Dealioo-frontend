const RESTAURANT_CAMPAIGNS_INDEX = /^\/restaurant\/\d+\/dashboard\/campaigns$/;

const RESTAURANT_CAMPAIGN_WORKSPACE =
  /^\/restaurant\/\d+\/dashboard\/campaigns\/\d+(?:\/.*)?$/;

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
