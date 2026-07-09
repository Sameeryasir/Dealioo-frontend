"use client";

import { useEffect, useRef } from "react";
import {
  isPusherConfigured,
  type ChatMessagePusherPayload,
} from "@/app/lib/pusher-chat";
import { subscribeRestaurantChatMessages } from "@/app/lib/pusher-client";

export function useBusinessChatPusher(
  restaurantId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!isPusherConfigured()) {
      console.warn("[Chat Pusher] Not configured — set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.");
      return;
    }

    if (restaurantId < 1) {
      return;
    }

    console.log("[Chat Pusher] Hook listening for messages", { restaurantId });

    return subscribeRestaurantChatMessages(restaurantId, (payload) => {
      if (payload.restaurantId !== restaurantId) {
        console.warn("[Chat Pusher] Ignored message for different restaurant", {
          expectedRestaurantId: restaurantId,
          payloadRestaurantId: payload.restaurantId,
          customerId: payload.customerId,
        });
        return;
      }

      console.log("[Chat Pusher] Delivering message to UI handler", {
        restaurantId,
        customerId: payload.customerId,
        messageId: payload.message.id,
        preview: payload.lastMessagePreview,
      });
      onMessageRef.current(payload);
    });
  }, [restaurantId]);
}
