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
    if (!isPusherConfigured()) {
      console.warn(
        "[Chat Pusher] Not configured — set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.",
      );
      return;
    }

    if (businessId < 1) {
      return;
    }

    console.log("[Chat Pusher] Listening on business conversation channel", {
      businessId,
    });

    return subscribeBusinessConversations(businessId, (payload) => {
      if (payload.businessId !== businessId) {
        console.warn("[Chat Pusher] Ignored conversation for different business", {
          expectedBusinessId: businessId,
          payloadBusinessId: payload.businessId,
          conversationId: payload.conversationId,
        });
        return;
      }

      try {
        console.log("[Chat Pusher] Delivering conversation update to UI", {
          businessId,
          conversationId: payload.conversationId,
          customerId: payload.customerId,
          messageId: payload.message.id,
          preview: payload.lastMessagePreview,
        });
        onUpdateRef.current(payload);
      } catch (error) {
        console.warn("[Chat Pusher] Conversation handler failed", {
          businessId,
          conversationId: payload.conversationId,
          error,
        });
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
      console.log("[Chat Pusher] Skipping message channel (no open chat)", {
        enabled,
        businessId,
        conversationId,
      });
      return;
    }

    if (!isPusherConfigured()) {
      console.warn(
        "[Chat Pusher] Not configured — set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.",
      );
      return;
    }

    console.log("[Chat Pusher] Subscribing to conversation message channel", {
      businessId,
      conversationId,
    });

    return subscribeConversationMessages(
      businessId,
      conversationId,
      (payload) => {
        if (
          payload.businessId !== businessId ||
          payload.conversationId !== conversationId
        ) {
          console.warn(
            "[Chat Pusher] Ignored message for different conversation",
            {
              expectedBusinessId: businessId,
              expectedConversationId: conversationId,
              payloadBusinessId: payload.businessId,
              payloadConversationId: payload.conversationId,
            },
          );
          return;
        }

        try {
          console.log("[Chat Pusher] Delivering message to open thread", {
            businessId,
            conversationId,
            messageId: payload.message.id,
            preview: payload.lastMessagePreview,
          });
          onMessageRef.current(payload);
        } catch (error) {
          console.warn("[Chat Pusher] Message handler failed", {
            businessId,
            conversationId,
            error,
          });
        }
      },
    );
  }, [businessId, conversationId, enabled]);
}

export function useBusinessChatPusher(
  businessId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
): void {
  useBusinessConversationsPusher(businessId, onMessage);
}
