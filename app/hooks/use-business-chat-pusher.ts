"use client";

import { useEffect, useRef } from "react";
import {
  isPusherConfigured,
  type ChatMessagePusherPayload,
} from "@/app/lib/pusher-chat";
import { subscribeRestaurantChatMessages } from "@/app/lib/pusher-client";

export function useBusinessChatPusher(
  businessId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!isPusherConfigured()) {
      console.warn("[Chat Pusher] Not configured — set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.");
      return;
    }

    if (businessId < 1) {
      return;
    }

    console.log("[Chat Pusher] Hook listening for messages", { businessId });

    return subscribeRestaurantChatMessages(businessId, (payload) => {
      if (payload.businessId !== businessId) {
        console.warn("[Chat Pusher] Ignored message for different business", {
          expectedBusinessId: businessId,
          payloadBusinessId: payload.businessId,
          customerId: payload.customerId,
        });
        return;
      }

      console.log("[Chat Pusher] Delivering message to UI handler", {
        businessId,
        customerId: payload.customerId,
        messageId: payload.message.id,
        preview: payload.lastMessagePreview,
      });
      onMessageRef.current(payload);
    });
  }, [businessId]);
}
