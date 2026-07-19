"use client";

import { formatTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-business-conversation";
import { GuestChatAutomationBadge } from "./GuestChatAutomationBadge";
import {
  isGuestInboundMessage,
  messagePreview,
  type GuestChatBubbleStackPosition,
} from "./guest-chats-utils";
import { LinkifiedText } from "./LinkifiedText";

function automationSourceLabel(message: ConversationMessage): string | null {
  const funnel =
    message.funnelName?.trim() || message.campaignName?.trim() || "";
  const automation = message.automationName?.trim() || "";
  if (funnel && automation) {
    return `Funnel: ${funnel} · ${automation}`;
  }
  if (funnel) {
    return `Funnel: ${funnel}`;
  }
  if (automation) {
    return automation;
  }
  return null;
}

export type { GuestChatBubbleStackPosition };

function BubbleTail({
  position,
  className,
}: {
  position: "bottom-right" | "bottom-left";
  className: string;
}) {
  if (position === "bottom-right") {
    return (
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-0 -right-[6px] h-[13px] w-[13px] rounded-bl-[13px] ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute bottom-0 -left-[6px] h-[13px] w-[13px] rounded-br-[13px] ${className}`}
    />
  );
}

function guestBubbleRadius(stackPosition: GuestChatBubbleStackPosition): string {
  switch (stackPosition) {
    case "single":
      return "rounded-[18px] rounded-bl-[4px]";
    case "first":
      return "rounded-[18px] rounded-bl-[6px]";
    case "middle":
      return "rounded-[18px] rounded-tl-[6px] rounded-bl-[6px]";
    case "last":
      return "rounded-[18px] rounded-tl-[6px] rounded-bl-[4px]";
  }
}

function outboundBubbleRadius(stackPosition: GuestChatBubbleStackPosition): string {
  switch (stackPosition) {
    case "single":
      return "rounded-[18px] rounded-br-[4px]";
    case "first":
      return "rounded-[18px] rounded-br-[6px]";
    case "middle":
      return "rounded-[18px] rounded-tr-[6px] rounded-br-[6px]";
    case "last":
      return "rounded-[18px] rounded-tr-[6px] rounded-br-[4px]";
  }
}

export function GuestChatMessageBubble({
  message,
  stackPosition = "single",
}: {
  message: ConversationMessage;
  index?: number;
  stackPosition?: GuestChatBubbleStackPosition;
}) {
  const isError = message.kind === "error";
  const isGuestMessage = !isError && isGuestInboundMessage(message);
  const body = messagePreview(message);
  const sourceLabel =
    !isError && !isGuestMessage ? automationSourceLabel(message) : null;
  const isStackEnd = stackPosition === "single" || stackPosition === "last";
  const rowSpacing =
    stackPosition === "first" || stackPosition === "middle" ? "mb-2" : "mb-4";

  const guestBubbleBg =
    "bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] ring-1 ring-white/20";
  const guestTailBg = "bg-[#0f5ed7]";

  const rowClass = isGuestMessage
    ? `flex w-full justify-start px-3 sm:px-4 ${rowSpacing}`
    : `flex w-full justify-end px-3 sm:px-4 ${rowSpacing}`;

  const bubbleBg = isError
    ? "bg-red-50"
    : isGuestMessage
      ? guestBubbleBg
      : "bg-white";

  let bubbleClass =
    "relative max-w-[min(28rem,82%)] overflow-hidden text-left px-3.5 py-2 shadow-sm sm:px-4 sm:py-2.5";

  if (isError) {
    bubbleClass += " text-red-800 rounded-[18px]";
  } else if (isGuestMessage) {
    bubbleClass += ` text-white shadow-[0_8px_18px_rgba(24,119,242,0.32)] ${bubbleBg} ${guestBubbleRadius(stackPosition)}`;
  } else {
    bubbleClass += ` text-zinc-800 bg-white ring-1 ring-[#e8edf5] ${outboundBubbleRadius(stackPosition)}`;
  }

  const textClass =
    "break-words [overflow-wrap:anywhere] whitespace-pre-wrap text-[15px] leading-[1.35] font-normal tracking-[-0.01em]";
  const timeClass = isGuestMessage
    ? "shrink-0 text-[11px] font-normal text-blue-100"
    : "shrink-0 text-[11px] font-normal text-zinc-400/90";

  const tailPosition = isGuestMessage ? "bottom-left" : "bottom-right";
  const tailClass = isGuestMessage ? guestTailBg : bubbleBg;

  return (
    <div className={rowClass}>
      <article className={bubbleClass}>
        {isStackEnd && !isError ? (
          <BubbleTail position={tailPosition} className={tailClass} />
        ) : null}

        <div className="relative z-[1] min-w-0">
          {sourceLabel ? (
            <div className="mb-1.5">
              <GuestChatAutomationBadge label={sourceLabel} compact />
            </div>
          ) : null}
          <LinkifiedText
            text={body}
            className={textClass}
            linkClassName={
              isGuestMessage
                ? "font-medium text-blue-50 underline decoration-blue-200/80 underline-offset-2"
                : "font-medium text-blue-600 underline decoration-blue-300/70 underline-offset-2 transition hover:text-blue-700"
            }
          />
          <div
            className={`mt-1 flex ${isGuestMessage ? "justify-start" : "justify-end"}`}
          >
            <time className={timeClass}>{formatTimeShort(message.sentAt)}</time>
          </div>
        </div>
      </article>
    </div>
  );
}
