const GOOGLE_ADS_PATH = /^\/business\/\d+\/dashboard\/google-ads(?:\/|$)/;

export function isGoogleAdsPath(pathname: string | null | undefined): boolean {
  return GOOGLE_ADS_PATH.test(pathname ?? "");
}
