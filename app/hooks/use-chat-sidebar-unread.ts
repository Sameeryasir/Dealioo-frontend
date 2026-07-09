"use client";

import { getChatUnreadSummary } from "@/app/services/chat/get-chat-unread-summary";
import { markRestaurantChatsRead } from "@/app/services/chat/mark-business-chats-read";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  readChatHasUnread,
  writeChatHasUnread,
} from "@/app/lib/chat-unread-storage";
import { getSetupUser } from "@/app/lib/setup-user";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useBusinessChatPusher } from "@/app/hooks/use-business-chat-pusher";

function isOnChatsRoute(pathname: string, chatsPathPrefix: string | null): boolean {
  if (!chatsPathPrefix) return false;
  return pathname === chatsPathPrefix || pathname.startsWith(`${chatsPathPrefix}/`);
}

function resolveUserId(): number | null {
  const id = getSetupUser()?.id;
  return typeof id === "number" && id > 0 ? id : null;
}

export function useChatSidebarUnread(
  businessId: number | null,
  chatsPathPrefix: string | null,
): boolean {
  const pathname = usePathname();
  const [userId, setUserId] = useState<number | null>(() => resolveUserId());
  const [hasUnread, setHasUnread] = useState(false);
  const pathnameRef = useRef(pathname);
  const chatsPrefixRef = useRef(chatsPathPrefix);
  const businessIdRef = useRef(businessId);
  const userIdRef = useRef(userId);

  pathnameRef.current = pathname;
  chatsPrefixRef.current = chatsPathPrefix;
  businessIdRef.current = businessId;
  userIdRef.current = userId;

  const onChatsPage = isOnChatsRoute(pathname, chatsPathPrefix);

  useEffect(() => {
    const syncUserId = () => setUserId(resolveUserId());
    syncUserId();
    window.addEventListener("focus", syncUserId);
    return () => window.removeEventListener("focus", syncUserId);
  }, []);

  const persistUnread = useCallback(
    (id: number, restaurant: number, unread: boolean) => {
      setHasUnread(unread);
      writeChatHasUnread(id, restaurant, unread);
    },
    [],
  );

  const refreshUnreadFromServer = useCallback(
    async (restaurant: number, user: number) => {
      if (!hasAuthSession()) return;

      try {
        const summary = await getChatUnreadSummary(restaurant);
        persistUnread(user, restaurant, summary.hasUnread);
      } catch {}
    },
    [persistUnread],
  );

  useEffect(() => {
    if (businessId == null || businessId < 1 || userId == null) {
      setHasUnread(false);
      return;
    }

    if (!hasAuthSession()) {
      return;
    }

    if (onChatsPage) {
      persistUnread(userId, businessId, false);
      void markRestaurantChatsRead(businessId)
        .then(() => writeChatHasUnread(userId, businessId, false))
        .catch(() => {});
      return;
    }

    const cachedUnread = readChatHasUnread(userId, businessId);
    if (cachedUnread) {
      setHasUnread(true);
    }

    void refreshUnreadFromServer(businessId, userId);
  }, [
    businessId,
    userId,
    onChatsPage,
    persistUnread,
    refreshUnreadFromServer,
  ]);

  useEffect(() => {
    if (
      businessId == null ||
      businessId < 1 ||
      userId == null ||
      onChatsPage ||
      !hasAuthSession()
    ) {
      return;
    }

    const onFocus = () => {
      void refreshUnreadFromServer(businessId, userId);
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [businessId, userId, onChatsPage, refreshUnreadFromServer]);

  useBusinessChatPusher(businessId ?? 0, (payload) => {
    const business = businessIdRef.current;
    const user = userIdRef.current;
    if (business == null || business < 1 || user == null) return;
    if (payload.message.direction !== "inbound") return;

    const prefix = chatsPrefixRef.current;
    const path = pathnameRef.current;
    if (isOnChatsRoute(path, prefix)) return;

    persistUnread(user, business, true);
    void refreshUnreadFromServer(business, user);
  });

  return hasUnread && !onChatsPage;
}
