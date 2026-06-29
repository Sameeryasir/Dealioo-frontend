"use client";

import { useEffect, useRef } from "react";
import {
  isPusherConfigured,
  type ChatMessagePusherPayload,
} from "@/app/lib/pusher-chat";
import { subscribeRestaurantChatMessages } from "@/app/lib/pusher-client";

export function useRestaurantChatPusher(
  restaurantId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!isPusherConfigured() || restaurantId < 1) {
      return;
    }

    return subscribeRestaurantChatMessages(restaurantId, (payload) => {
      if (payload.restaurantId !== restaurantId) return;
      onMessageRef.current(payload);
    });
  }, [restaurantId]);
}
