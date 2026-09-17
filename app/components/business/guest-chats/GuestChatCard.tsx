"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { formatDateTimeShort } from "@/app/lib/datetime";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { CHAT_USE_INDEXED_DB } from "@/app/services/chat/chat-cache-mode";
import { prefetchConversationMessageCache } from "@/app/services/chat/chat-indexed-db";
import { GuestChatAvatar } from "./GuestChatAvatar";
import { guestChatHoverLift } from "./guest-chats-motion";
import { guestDisplayName, listItemPreview } from "./guest-chats-utils";

export const GuestChatCard = memo(function GuestChatCard({
  row,
  businessId,
  selected,
  unreadCount,
  onSelect,
}: {
  row: ChatCustomer;
  businessId: number;
  selected: boolean;
  unreadCount: number;
  onSelect: () => void;
}) {
  const name = guestDisplayName(row);
  const preview = listItemPreview(row);
  const showUnread = !selected && unreadCount > 0;
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  function warmCache() {
    if (CHAT_USE_INDEXED_DB) {
      prefetchConversationMessageCache(businessId, row.customerId);
    }
  }

  return (
    <motion.button
      type="button"
      onMouseDown={warmCache}
      onClick={onSelect}
      onMouseEnter={warmCache}
      variants={guestChatHoverLift}
      initial="rest"
      animate={selected ? "selected" : "rest"}
      className={`group w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 ${
        selected
          ? "border-[#1877f2]/45 bg-[#e8f2ff]/70 ring-1 ring-[#1877f2]/20"
          : showUnread
            ? "border-[#1877f2]/30 bg-[#f5f9ff]"
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
            <p
              className={`truncate text-base tracking-tight text-zinc-900 ${
                showUnread ? "font-extrabold" : "font-bold"
              }`}
            >
              {name}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <time
                className={`text-[13px] font-medium ${
                  showUnread ? "text-[#1877f2]" : "text-zinc-400"
                }`}
              >
                {formatDateTimeShort(row.lastMessageAt)}
              </time>
              {showUnread ? (
                <span
                  className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#1877f2] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white"
                  aria-label={`${unreadLabel} unread messages`}
                >
                  {unreadLabel}
                </span>
              ) : null}
            </div>
          </div>

          <p
            className={`mt-1 line-clamp-1 text-sm leading-snug ${
              showUnread ? "font-semibold text-zinc-800" : "text-zinc-600"
            }`}
          >
            {preview}
          </p>
        </div>
      </div>
    </motion.button>
  );
});
