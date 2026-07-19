const GUEST_CHATS_PATH = /^\/business\/\d+\/dashboard\/chats(?:\/|$)/;

export function isGuestChatsPath(pathname: string | null | undefined): boolean {
  return GUEST_CHATS_PATH.test(pathname ?? "");
}
