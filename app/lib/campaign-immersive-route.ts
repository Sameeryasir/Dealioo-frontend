const CAMPAIGN_IMMERSIVE_PATH =
  /^\/business\/\d+\/dashboard\/campaigns\/\d+(?:\/|$)/;

export function isCampaignImmersivePath(pathname: string | null | undefined): boolean {
  return CAMPAIGN_IMMERSIVE_PATH.test(pathname ?? "");
}
