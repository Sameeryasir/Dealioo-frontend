"use client";

import { motion } from "framer-motion";
import { formatTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-restaurant-conversation";
import { guestChatMessageReveal } from "./guest-chats-motion";
import { messagePreview } from "./guest-chats-utils";
import { LinkifiedText } from "./LinkifiedText";

export type GuestChatBubbleStackPosition = "single" | "first" | "middle" | "last";

function BubbleTail({
  position,
  className,
}: {
  position: "top-right" | "bottom-right";
  className: string;
}) {
  if (position === "top-right") {
    return (
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0 -right-[7px] h-[14px] w-[14px] rounded-tr-[14px] ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute bottom-0 -right-[7px] h-[14px] w-[14px] rounded-bl-[14px] ${className}`}
    />
  );
}

export function GuestChatMessageBubble({
  message,
  index,
  stackPosition = "single",
}: {
  message: ConversationMessage;
  index: number;
  stackPosition?: GuestChatBubbleStackPosition;
}) {
  const isError = message.kind === "error";
  const body = messagePreview(message);

  const rowClass =
    stackPosition === "first" || stackPosition === "middle"
      ? "flex w-full justify-end pl-14 pr-3 pt-0.5 sm:pl-20 sm:pr-4"
      : "flex w-full justify-end pl-14 pr-3 sm:pl-20 sm:pr-4";

  const bubbleBg = isError ? "bg-red-50" : "bg-white";
  const tailBg = isError ? "bg-red-50" : "bg-white";

  let bubbleClass =
    "relative max-w-[min(28rem,88%)] text-left px-3 py-2 shadow-sm sm:px-3.5 sm:py-2.5";

  if (isError) {
    bubbleClass += " text-red-800";
  } else {
    bubbleClass += " text-zinc-800";
  }

  if (stackPosition === "single") {
    bubbleClass += ` ${bubbleBg} rounded-[12px] rounded-br-[3px]`;
  } else if (stackPosition === "first") {
    bubbleClass += ` ${bubbleBg} rounded-[12px] rounded-tr-[3px]`;
  } else if (stackPosition === "middle") {
    bubbleClass += ` ${bubbleBg} rounded-[12px]`;
  } else {
    bubbleClass += ` ${bubbleBg} rounded-[12px]`;
  }

  const textClass = "whitespace-pre-wrap text-[14.5px] leading-[1.35] sm:text-[15px]";
  const timeClass = "shrink-0 text-[11px] font-normal text-zinc-400/90";

  const showTopTail = stackPosition === "first";
  const showBottomTail = stackPosition === "single";

  return (
    <motion.div
      custom={index}
      variants={guestChatMessageReveal}
      initial="hidden"
      animate="show"
      className={rowClass}
    >
      <article className={bubbleClass}>
        {showTopTail ? <BubbleTail position="top-right" className={tailBg} /> : null}
        {showBottomTail ? <BubbleTail position="bottom-right" className={tailBg} /> : null}

        <div className="relative z-[1] min-w-0">
          <LinkifiedText text={body} className={textClass} />
          <div className="mt-1 flex justify-end">
            <time className={timeClass}>{formatTimeShort(message.sentAt)}</time>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
