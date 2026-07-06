const CHAT_UNREAD_STORAGE_PREFIX = "retention:chat-unread:";

function storageKey(restaurantId: number): string {
  return `${CHAT_UNREAD_STORAGE_PREFIX}${restaurantId}`;
}

export function readChatHasUnread(restaurantId: number): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(storageKey(restaurantId)) === "1";
}

export function writeChatHasUnread(
  restaurantId: number,
  hasUnread: boolean,
): void {
  if (typeof sessionStorage === "undefined") return;
  if (hasUnread) {
    sessionStorage.setItem(storageKey(restaurantId), "1");
  } else {
    sessionStorage.removeItem(storageKey(restaurantId));
  }
}
