"use client";

import { Mail, MessageSquare, Smartphone } from "lucide-react";
import type { ConversationMessageKind } from "@/app/services/chat/get-business-conversation";

const ICON_STROKE = 2;

export function GuestChatChannelIcon({
  channel,
  className = "size-3.5",
}: {
  channel: ConversationMessageKind | null | undefined;
  className?: string;
}) {
  const tone =
    channel === "email"
      ? "text-blue-500"
      : channel === "sms"
        ? "text-green-500"
        : channel === "whatsapp"
          ? "text-emerald-500"
          : "text-zinc-400";

  const Icon =
    channel === "email" ? Mail : channel === "whatsapp" ? MessageSquare : Smartphone;

  return <Icon className={`${className} shrink-0 ${tone}`} aria-hidden strokeWidth={ICON_STROKE} />;
}
