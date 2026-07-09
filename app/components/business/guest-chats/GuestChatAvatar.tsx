"use client";

import { motion } from "framer-motion";
import { channelGradientClass, guestInitials } from "./guest-chats-utils";
import type { ConversationMessageKind } from "@/app/services/chat/get-business-conversation";

export function GuestChatAvatar({
  name,
  email,
  customerId,
  channel,
  size = "md",
  animated = false,
}: {
  name: string | null;
  email: string | null;
  customerId: number;
  channel?: ConversationMessageKind | null;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}) {
  const initials = guestInitials({ customerId, customerName: name, customerEmail: email });
  const sizeClass =
    size === "lg"
      ? "size-14 text-base"
      : size === "sm"
        ? "size-10 text-xs"
        : "size-11 text-sm";

  const className = `relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white shadow-md ring-2 ${sizeClass} ${channelGradientClass(channel)}`;

  if (animated) {
    return (
      <motion.span
        className={className}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28 }}
        whileHover={{ scale: 1.04 }}
      >
        {initials}
      </motion.span>
    );
  }

  return <span className={className}>{initials}</span>;
}
