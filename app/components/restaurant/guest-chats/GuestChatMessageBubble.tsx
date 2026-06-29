"use client";

import { motion } from "framer-motion";
import { formatDateTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-restaurant-conversation";
import { guestChatMessageReveal } from "./guest-chats-motion";
import { messagePreview } from "./guest-chats-utils";
import { LinkifiedText } from "./LinkifiedText";

export function GuestChatMessageBubble({
  message,
  index,
}: {
  message: ConversationMessage;
  index: number;
}) {
  const isOutbound = message.direction === "outbound";
  const body = messagePreview(message);

  if (!isOutbound) {
    return (
      <motion.div
        custom={index}
        variants={guestChatMessageReveal}
        initial="hidden"
        animate="show"
        className="flex justify-center px-2"
      >
        <div
          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-center text-xs leading-relaxed shadow-sm ${
            message.kind === "error"
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-zinc-200/80 bg-white text-zinc-600"
          }`}
        >
          <LinkifiedText text={body} />
          <p className="mt-1.5 text-[11px] font-medium text-zinc-400">
            {formatDateTimeShort(message.sentAt)}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={index}
      variants={guestChatMessageReveal}
      initial="hidden"
      animate="show"
      className="flex justify-end pl-6 pr-2 sm:pl-12"
    >
      <article className="max-w-[28rem] rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
        <LinkifiedText
          text={body}
          className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800"
        />
        <time className="mt-2 block text-[11px] font-medium text-zinc-400">
          {formatDateTimeShort(message.sentAt)}
        </time>
      </article>
    </motion.div>
  );
}
