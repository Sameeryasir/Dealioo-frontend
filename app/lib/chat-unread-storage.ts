const CHAT_UNREAD_STORAGE_PREFIX = "retention:chat-unread:";

function storageKey(userId: number, businessId: number): string {
  return `${CHAT_UNREAD_STORAGE_PREFIX}${userId}:${businessId}`;
}

export function readChatHasUnread(
  userId: number,
  businessId: number,
): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(storageKey(userId, businessId)) === "1";
}

export function writeChatHasUnread(
  userId: number,
  businessId: number,
  hasUnread: boolean,
): void {
  if (typeof localStorage === "undefined") return;
  const key = storageKey(userId, businessId);
  if (hasUnread) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
}
