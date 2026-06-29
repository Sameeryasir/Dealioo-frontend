"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { ChatCustomer } from "@/app/services/chat/get-restaurant-chat-customers";
import { GuestChatAvatar } from "./GuestChatAvatar";
import { GuestChatIconButton } from "./GuestChatIconButton";
import { guestDisplayName } from "./guest-chats-utils";

export function GuestChatConversationHeader({
  row,
  onRefresh,
  refreshing = false,
  onBack,
}: {
  row: ChatCustomer;
  onRefresh: () => void;
  refreshing?: boolean;
  onBack?: () => void;
}) {
  const name = guestDisplayName(row);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-zinc-200/80 bg-white px-4 py-3 sm:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex rounded-lg border border-zinc-200 p-1.5 text-zinc-600 transition hover:bg-zinc-50 lg:hidden"
              aria-label="Back to guest list"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
            </button>
          ) : null}

          <GuestChatAvatar
            name={row.customerName}
            email={row.customerEmail}
            customerId={row.customerId}
            channel={row.lastMessageChannel}
            size="sm"
            animated
          />

          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900">{name}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <GuestChatIconButton
            icon={RefreshCw}
            label="Refresh conversation"
            onClick={onRefresh}
            spinning={refreshing}
            compact
          />
        </div>
      </div>
    </motion.div>
  );
}
