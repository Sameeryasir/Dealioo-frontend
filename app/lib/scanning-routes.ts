export type ScanningTabId = "scan" | "search" | "create";

export function scanningBasePath(businessId: string | number): string {
  return `/business/${businessId}/dashboard/scanning`;
}

export function scanningHref(
  businessId: string | number,
  tab: ScanningTabId = "scan",
): string {
  const base = scanningBasePath(businessId);
  if (tab === "scan") return base;
  if (tab === "search") return `${base}/search`;
  return `${base}/new-guest`;
}

export function scanningTabFromPathname(
  pathname: string,
  businessId: string | number,
): ScanningTabId {
  const base = scanningBasePath(businessId);
  if (pathname === base || pathname === `${base}/`) return "scan";
  if (pathname.startsWith(`${base}/search`)) return "search";
  if (pathname.startsWith(`${base}/new-guest`)) return "create";
  return "scan";
}
