const storageKey = (businessId: number) =>
  `dealio.performance.month.${businessId}`;

export function readStoredPerformanceMonth(businessId: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(businessId))?.trim();
    return raw ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredPerformanceMonth(
  businessId: number,
  month: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey(businessId), month);
  } catch {}
}
