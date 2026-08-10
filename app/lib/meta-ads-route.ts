const META_ADS_PATH = /^\/business\/\d+\/dashboard\/meta(?:\/|$)/;

export function isMetaAdsPath(pathname: string | null | undefined): boolean {
  return META_ADS_PATH.test(pathname ?? "");
}
