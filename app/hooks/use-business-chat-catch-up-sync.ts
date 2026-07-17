"use client";

import { useEffect } from "react";

export const CHAT_SAFETY_SYNC_MS = 8_000;

export function registerGuestChatCatchUpSync(
  _handler: () => Promise<void>,
): () => void {
  return () => {};
}

export function registerConversationCatchUpSync(
  _handler: () => Promise<void>,
): () => void {
  return () => {};
}

export function useGuestChatCatchUpRegistration(
  _handler: () => Promise<void>,
) {
  useEffect(() => {}, []);
}

export function useConversationCatchUpRegistration(
  _handler: () => Promise<void>,
) {
  useEffect(() => {}, []);
}
