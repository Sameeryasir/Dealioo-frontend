export type ScanningTabId = "scan" | "search" | "create";

export function scanningBasePath(businessId: string | number): string {
  return `/business/${businessId}/dashboard/scanning`;
}

export function scanningHref(businessId: string | number): string {
  return scanningBasePath(businessId);
}
