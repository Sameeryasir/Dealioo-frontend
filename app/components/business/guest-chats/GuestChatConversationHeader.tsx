"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { GuestChatAvatar } from "./GuestChatAvatar";
import { guestDisplayName } from "./guest-chats-utils";

export function GuestChatConversationHeader({
  row,
  onBack,
}: {
  row: ChatCustomer;
  onBack?: () => void;
}) {
  const name = guestDisplayName(row);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-[#e8edf5] bg-gradient-to-r from-[#e8f2ff]/50 via-white to-white px-4 py-3 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex rounded-lg border border-[#e8edf5] p-1.5 text-[#1877f2] transition hover:bg-[#e8f2ff] lg:hidden"
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

        <h2 className="truncate text-base font-semibold tracking-tight text-[#07111f]">{name}</h2>
      </div>
    </motion.div>
  );
}
