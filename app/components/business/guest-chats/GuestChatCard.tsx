"use client";

import { motion } from "framer-motion";
import { formatDateTimeShort } from "@/app/lib/datetime";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { prefetchConversationMessageCache } from "@/app/services/chat/chat-indexed-db";
import { GuestChatAvatar } from "./GuestChatAvatar";
import { guestChatHoverLift } from "./guest-chats-motion";
import { guestDisplayName, listItemPreview } from "./guest-chats-utils";

export function GuestChatCard({
  row,
  businessId,
  selected,
  onSelect,
}: {
  row: ChatCustomer;
  businessId: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = guestDisplayName(row);
  const preview = listItemPreview(row);

  return (
    <motion.button
      type="button"
      onMouseDown={() =>
        prefetchConversationMessageCache(businessId, row.customerId)
      }
      onClick={onSelect}
      onMouseEnter={() =>
        prefetchConversationMessageCache(businessId, row.customerId)
      }
      variants={guestChatHoverLift}
      initial="rest"
      animate={selected ? "selected" : "rest"}
      className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
        selected
          ? "border-[#1877f2]/45 bg-[#e8f2ff]/70 ring-1 ring-[#1877f2]/20"
          : "border-[#e8edf5] bg-white hover:border-[#1877f2]/25 hover:bg-[#f8fafc]"
      }`}
    >
      <div className="flex items-start gap-3">
        <GuestChatAvatar
          name={row.customerName}
          email={row.customerEmail}
          customerId={row.customerId}
          channel={row.lastMessageChannel}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-base font-bold tracking-tight text-zinc-900">{name}</p>
            <time className="shrink-0 text-[13px] font-medium text-zinc-400">
              {formatDateTimeShort(row.lastMessageAt)}
            </time>
          </div>

          <p className="mt-1 line-clamp-1 text-sm leading-snug text-zinc-600">{preview}</p>
        </div>
      </div>
    </motion.button>
  );
}
