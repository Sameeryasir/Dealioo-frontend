"use client";

import { useEffect } from "react";
import { subscribePusherReconnect } from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-chat";

export const CHAT_SAFETY_SYNC_MS = 30_000;

const guestCatchUpHandlers = new Set<() => Promise<void>>();
const conversationCatchUpHandlers = new Set<() => Promise<void>>();

let listenersAttached = false;

function runCatchUpSync() {
  for (const handler of guestCatchUpHandlers) {
    void handler();
  }

  for (const handler of conversationCatchUpHandlers) {
    void handler();
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    runCatchUpSync();
  }
}

function handleWindowFocus() {
  runCatchUpSync();
}

function ensureCatchUpListeners() {
  if (listenersAttached) {
    return;
  }

  listenersAttached = true;

  if (isPusherConfigured()) {
    subscribePusherReconnect(runCatchUpSync);
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleWindowFocus);

  window.setInterval(() => {
    runCatchUpSync();
  }, CHAT_SAFETY_SYNC_MS);
}

export function registerGuestChatCatchUpSync(
  handler: () => Promise<void>,
): () => void {
  ensureCatchUpListeners();
  guestCatchUpHandlers.add(handler);

  return () => {
    guestCatchUpHandlers.delete(handler);
  };
}

export function registerConversationCatchUpSync(
  handler: () => Promise<void>,
): () => void {
  ensureCatchUpListeners();
  conversationCatchUpHandlers.add(handler);

  return () => {
    conversationCatchUpHandlers.delete(handler);
  };
}

export function useGuestChatCatchUpRegistration(
  handler: () => Promise<void>,
) {
  useEffect(() => registerGuestChatCatchUpSync(handler), [handler]);
}

export function useConversationCatchUpRegistration(
  handler: () => Promise<void>,
) {
  useEffect(() => registerConversationCatchUpSync(handler), [handler]);
}
