const CHAT_UNREAD_STORAGE_PREFIX = "retention:chat-unread:";

function storageKey(userId: number, restaurantId: number): string {
  return `${CHAT_UNREAD_STORAGE_PREFIX}${userId}:${restaurantId}`;
}

export function readChatHasUnread(
  userId: number,
  restaurantId: number,
): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(storageKey(userId, restaurantId)) === "1";
}

export function writeChatHasUnread(
  userId: number,
  restaurantId: number,
  hasUnread: boolean,
): void {
  if (typeof localStorage === "undefined") return;
  const key = storageKey(userId, restaurantId);
  if (hasUnread) {
    localStorage.setItem(key, "1");
  } else {
    localStorage.removeItem(key);
  }
}
