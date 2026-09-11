"use client";

import { useEffect, useRef } from "react";
import {
  isPusherConfigured,
  type ChatMessagePusherPayload,
} from "@/app/lib/pusher-chat";
import {
  subscribeBusinessConversations,
  subscribeConversationMessages,
} from "@/app/lib/pusher-client";

export function useBusinessConversationsPusher(
  businessId: number,
  onUpdate: (payload: ChatMessagePusherPayload) => void,
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!isPusherConfigured() || businessId < 1) {
      return;
    }

    return subscribeBusinessConversations(businessId, (payload) => {
      if (payload.businessId !== businessId) {
        return;
      }

      try {
        onUpdateRef.current(payload);
      } catch {
        // Ignore handler errors so one bad update does not break the subscription.
      }
    });
  }, [businessId]);
}

export function useConversationMessagesPusher(
  businessId: number,
  conversationId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
  enabled = true,
): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || businessId < 1 || conversationId < 1) {
      return;
    }

    if (!isPusherConfigured()) {
      return;
    }

    return subscribeConversationMessages(
      businessId,
      conversationId,
      (payload) => {
        if (
          payload.businessId !== businessId ||
          payload.conversationId !== conversationId
        ) {
          return;
        }

        try {
          onMessageRef.current(payload);
        } catch {
          // Ignore handler errors so one bad update does not break the subscription.
        }
      },
    );
  }, [businessId, conversationId, enabled]);
}
