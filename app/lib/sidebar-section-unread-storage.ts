
const SECTION_UNREAD_STORAGE_PREFIX = "retention:sidebar-section-unread-count:";

export type SidebarUnreadSection = "orders" | "activity" | "history";

function storageKey(
  userId: number,
  businessId: number,
  section: SidebarUnreadSection,
): string {
  return `${SECTION_UNREAD_STORAGE_PREFIX}${userId}:${businessId}:${section}`;
}

export function readSectionUnreadCount(
  userId: number,
  businessId: number,
  section: SidebarUnreadSection,
): number {
  if (typeof localStorage === "undefined") return 0;
  const raw = localStorage.getItem(storageKey(userId, businessId, section));
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function writeSectionUnreadCount(
  userId: number,
  businessId: number,
  section: SidebarUnreadSection,
  count: number,
): void {
  if (typeof localStorage === "undefined") return;
  const key = storageKey(userId, businessId, section);
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  if (safe > 0) {
    localStorage.setItem(key, String(safe));
  } else {
    localStorage.removeItem(key);
  }
}
