"use client";

import {
  readChatHasUnread,
  writeChatHasUnread,
} from "@/app/lib/chat-unread-storage";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRestaurantChatPusher } from "@/app/hooks/use-restaurant-chat-pusher";

function isOnChatsRoute(pathname: string, chatsPathPrefix: string | null): boolean {
  if (!chatsPathPrefix) return false;
  return pathname === chatsPathPrefix || pathname.startsWith(`${chatsPathPrefix}/`);
}

export function useChatSidebarUnread(
  restaurantId: number | null,
  chatsPathPrefix: string | null,
): boolean {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(() =>
    restaurantId != null && restaurantId > 0
      ? readChatHasUnread(restaurantId)
      : false,
  );
  const pathnameRef = useRef(pathname);
  const chatsPrefixRef = useRef(chatsPathPrefix);
  const restaurantIdRef = useRef(restaurantId);

  pathnameRef.current = pathname;
  chatsPrefixRef.current = chatsPathPrefix;
  restaurantIdRef.current = restaurantId;

  const onChatsPage = isOnChatsRoute(pathname, chatsPathPrefix);

  useEffect(() => {
    if (restaurantId == null || restaurantId < 1) {
      setHasUnread(false);
      return;
    }

    if (onChatsPage) {
      writeChatHasUnread(restaurantId, false);
      setHasUnread(false);
      return;
    }

    setHasUnread(readChatHasUnread(restaurantId));
  }, [restaurantId, onChatsPage]);

  useRestaurantChatPusher(restaurantId ?? 0, (payload) => {
    const id = restaurantIdRef.current;
    if (id == null || id < 1) return;
    if (payload.message.direction !== "inbound") return;

    const prefix = chatsPrefixRef.current;
    const path = pathnameRef.current;
    if (isOnChatsRoute(path, prefix)) return;

    writeChatHasUnread(id, true);
    setHasUnread(true);
  });

  return hasUnread && !onChatsPage;
}
