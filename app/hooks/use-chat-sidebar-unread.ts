"use client";

import { markRestaurantChatsRead } from "@/app/services/chat/mark-business-chats-read";
import { getBusinessChatsUnread } from "@/app/services/chat/get-business-chats-unread";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  readChatHasUnread,
  writeChatHasUnread,
} from "@/app/lib/chat-unread-storage";
import { playNotificationChime } from "@/app/lib/play-notification-chime";
import { getSetupUser } from "@/app/lib/setup-user";
import { subscribePusherReconnect } from "@/app/lib/pusher-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useBusinessConversationsPusher } from "@/app/hooks/use-business-chat-pusher";

function isOnChatsRoute(pathname: string, chatsPathPrefix: string | null): boolean {
  if (!chatsPathPrefix) return false;
  return pathname === chatsPathPrefix || pathname.startsWith(`${chatsPathPrefix}/`);
}

function resolveUserId(): number | null {
  const id = getSetupUser()?.id;
  return typeof id === "number" && id > 0 ? id : null;
}

export type ChatSidebarUnreadState = {
  hasUnread: boolean;
  latestAt: string | null;
  markAllChatsRead: () => Promise<void>;
};

export function useChatSidebarUnread(
  businessId: number | null,
  chatsPathPrefix: string | null,
): ChatSidebarUnreadState {
  const pathname = usePathname();
  const [userId, setUserId] = useState<number | null>(() => resolveUserId());
  const [hasUnread, setHasUnread] = useState(false);
  const [latestAt, setLatestAt] = useState<string | null>(null);
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
    setUserId(resolveUserId());
  }, []);

  const persistUnread = useCallback(
    (
      id: number,
      restaurant: number,
      unread: boolean,
      inboundAt: string | null = null,
    ) => {
      setHasUnread(unread);
      setLatestAt(unread ? inboundAt : null);
      writeChatHasUnread(id, restaurant, unread);
    },
    [],
  );

  const markAllChatsRead = useCallback(async () => {
    const business = businessIdRef.current;
    const user = userIdRef.current;
    if (business == null || business < 1 || user == null) return;
    persistUnread(user, business, false, null);
    try {
      await markRestaurantChatsRead(business);
      writeChatHasUnread(user, business, false);
    } catch {
    }
  }, [persistUnread]);

  useEffect(() => {
    if (businessId == null || businessId < 1 || userId == null) {
      setHasUnread(false);
      setLatestAt(null);
      return;
    }

    if (!hasAuthSession()) {
      return;
    }

    if (onChatsPage) {
      persistUnread(userId, businessId, false, null);
      void markRestaurantChatsRead(businessId)
        .then(() => writeChatHasUnread(userId, businessId, false))
        .catch(() => {});
      return;
    }

    persistUnread(
      userId,
      businessId,
      readChatHasUnread(userId, businessId),
      null,
    );

    let cancelled = false;
    const refresh = () => {
      if (cancelled || !hasAuthSession()) return;
      void getBusinessChatsUnread(businessId)
        .then((result) => {
          if (cancelled) return;
          persistUnread(
            userId,
            businessId,
            result.hasUnread,
            result.latestInboundAt ?? null,
          );
        })
        .catch(() => {});
    };

    refresh();
    const timer = window.setInterval(refresh, 15_000);
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubReconnect = subscribePusherReconnect(() => refresh());

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubReconnect();
    };
  }, [businessId, userId, onChatsPage, persistUnread]);

  useBusinessConversationsPusher(businessId ?? 0, (payload) => {
    const business = businessIdRef.current;
    const user = userIdRef.current;
    if (business == null || business < 1 || user == null) return;
    if (payload.message.direction !== "inbound") return;
    if (payload.businessId !== business) return;

    const prefix = chatsPrefixRef.current;
    const path = pathnameRef.current;
    if (isOnChatsRoute(path, prefix)) return;

    const sentAt =
      typeof payload.message.sentAt === "string"
        ? payload.message.sentAt
        : new Date().toISOString();
    playNotificationChime();
    persistUnread(user, business, true, sentAt);
  });

  return {
    hasUnread: hasUnread && !onChatsPage,
    latestAt: hasUnread && !onChatsPage ? latestAt : null,
    markAllChatsRead,
  };
}
