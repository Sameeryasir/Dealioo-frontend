"use client";

import { markRestaurantChatsRead } from "@/app/services/chat/mark-business-chats-read";
import { hasAuthSession } from "@/app/lib/auth-session";
import {
  readChatHasUnread,
  writeChatHasUnread,
} from "@/app/lib/chat-unread-storage";
import { getSetupUser } from "@/app/lib/setup-user";
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
    setUserId(resolveUserId());
  }, []);

  const persistUnread = useCallback(
    (id: number, restaurant: number, unread: boolean) => {
      setHasUnread(unread);
      writeChatHasUnread(id, restaurant, unread);
    },
    [],
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

    persistUnread(userId, businessId, readChatHasUnread(userId, businessId));
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

    persistUnread(user, business, true);
  });

  return hasUnread && !onChatsPage;
}
