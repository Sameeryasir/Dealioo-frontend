"use client";

import { motion } from "framer-motion";
import { formatDateTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-restaurant-conversation";
import { guestChatMessageReveal } from "./guest-chats-motion";
import { messagePreview } from "./guest-chats-utils";
import { LinkifiedText } from "./LinkifiedText";

type MessageSide = "guest" | "you" | "automation";

function resolveMessageSide(message: ConversationMessage): MessageSide {
  if (message.direction === "inbound" || message.sentBy?.type === "customer") {
    return "guest";
  }

  if (
    message.direction === "outbound" &&
    message.kind === "sms" &&
    !message.stepType
  ) {
    return "you";
  }

  return "automation";
}

export function GuestChatMessageBubble({
  message,
  index,
}: {
  message: ConversationMessage;
  index: number;
}) {
  const isError = message.kind === "error";
  const body = messagePreview(message);
  const side = resolveMessageSide(message);
  const isGuest = side === "guest";
  const isYou = side === "you";
  const alignLeft = isYou;

  const rowClass = alignLeft
    ? "flex w-full justify-start pl-3 pr-14 sm:pl-4 sm:pr-20"
    : "flex w-full justify-end pl-14 pr-3 sm:pl-20 sm:pr-4";

  let bubbleClass =
    "max-w-[min(28rem,88%)] text-left rounded-2xl px-4 py-3 shadow-sm sm:px-5 sm:py-4";

  if (isError) {
    bubbleClass += " border border-red-200 bg-red-50 text-red-800";
  } else if (isGuest) {
    bubbleClass +=
      " rounded-br-md border border-zinc-200 bg-zinc-100 text-zinc-800";
  } else if (isYou) {
    bubbleClass += " rounded-bl-md bg-blue-600 text-white";
  } else {
    bubbleClass +=
      " rounded-br-md border border-zinc-200/80 bg-white text-zinc-800";
  }

  const textClass = isYou
    ? "whitespace-pre-wrap text-sm leading-relaxed text-white"
    : "whitespace-pre-wrap text-sm leading-relaxed";

  const timeClass = isYou
    ? "mt-3 block text-[11px] font-medium text-blue-100"
    : "mt-3 block text-[11px] font-medium text-zinc-400";

  return (
    <motion.div
      custom={index}
      variants={guestChatMessageReveal}
      initial="hidden"
      animate="show"
      className={rowClass}
    >
      <article className={bubbleClass}>
        <LinkifiedText text={body} className={textClass} />
        <time className={timeClass}>{formatDateTimeShort(message.sentAt)}</time>
      </article>
    </motion.div>
  );
}
