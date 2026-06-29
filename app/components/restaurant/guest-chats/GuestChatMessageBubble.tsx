"use client";

import { motion } from "framer-motion";
import { formatDateTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-restaurant-conversation";
import { guestChatMessageReveal } from "./guest-chats-motion";
import { messagePreview } from "./guest-chats-utils";
import { LinkifiedText } from "./LinkifiedText";

function messageCardClass(isError: boolean): string {
  if (isError) {
    return "rounded-2xl border border-red-200 bg-red-50 px-6 py-5 shadow-sm";
  }

  return "rounded-2xl bg-white px-6 py-5 shadow-sm";
}

export function GuestChatMessageBubble({
  message,
  index,
}: {
  message: ConversationMessage;
  index: number;
}) {
  const isOutbound = message.direction === "outbound";
  const isError = message.kind === "error";
  const body = messagePreview(message);
  const cardClass = messageCardClass(isError);

  if (!isOutbound) {
    return (
      <motion.div
        custom={index}
        variants={guestChatMessageReveal}
        initial="hidden"
        animate="show"
        className="flex w-full justify-end pl-14 pr-3 sm:pl-20 sm:pr-4"
      >
        <div
          className={`max-w-[min(28rem,88%)] text-left ${cardClass} ${
            isError ? "text-red-800" : "text-zinc-700"
          }`}
        >
          <LinkifiedText
            text={body}
            className="text-sm leading-relaxed"
          />
          <p className="mt-4 text-[11px] font-medium text-zinc-400">
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
      className="flex w-full justify-end pl-14 pr-3 sm:pl-20 sm:pr-4"
    >
      <article className={`ml-auto max-w-[min(28rem,88%)] ${cardClass}`}>
        <LinkifiedText
          text={body}
          className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800"
        />
        <time className="mt-4 block text-[11px] font-medium text-zinc-400">
          {formatDateTimeShort(message.sentAt)}
        </time>
      </article>
    </motion.div>
  );
}
