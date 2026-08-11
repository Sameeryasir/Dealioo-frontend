const ADS_TRACKING_PATH = /^\/business\/\d+\/dashboard\/ads-tracking(?:\/|$)/;

export function isAdsTrackingPath(pathname: string | null | undefined): boolean {
  return ADS_TRACKING_PATH.test(pathname ?? "");
}
