"use client";

import { formatTimeShort } from "@/app/lib/datetime";
import type { ConversationMessage } from "@/app/services/chat/get-business-conversation";
import { GuestChatAutomationBadge } from "./GuestChatAutomationBadge";
import {
  isGuestInboundMessage,
  messagePreview,
  extractPassCtaFromMessageBody,
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
  side,
  className,
}: {
  side: "left" | "right";
  className: string;
}) {
  if (side === "left") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 8 13"
        className={`pointer-events-none absolute bottom-0 -left-[7px] h-[13px] w-2 drop-shadow-[0_1px_0_rgba(15,23,42,0.06)] ${className}`}
      >
        <path
          d="M8 0v10.5C6.2 10.5 2.8 11.4 0 13 1.4 8.8 3.5 3.6 8 0Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 8 13"
      className={`pointer-events-none absolute bottom-0 -right-[7px] h-[13px] w-2 drop-shadow-[0_1px_0_rgba(15,23,42,0.06)] ${className}`}
    >
      <path
        d="M0 0v10.5C1.8 10.5 5.2 11.4 8 13 6.6 8.8 4.5 3.6 0 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function guestBubbleRadius(stackPosition: GuestChatBubbleStackPosition): string {
  switch (stackPosition) {
    case "single":
      return "rounded-2xl rounded-bl-md";
    case "first":
      return "rounded-2xl rounded-bl-lg";
    case "middle":
      return "rounded-2xl rounded-tl-lg rounded-bl-lg";
    case "last":
      return "rounded-2xl rounded-tl-lg rounded-bl-md";
  }
}

function outboundBubbleRadius(stackPosition: GuestChatBubbleStackPosition): string {
  switch (stackPosition) {
    case "single":
      return "rounded-2xl rounded-br-md";
    case "first":
      return "rounded-2xl rounded-br-lg";
    case "middle":
      return "rounded-2xl rounded-tr-lg rounded-br-lg";
    case "last":
      return "rounded-2xl rounded-tr-lg rounded-br-md";
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
  const rawBody = messagePreview(message);
  const passCta = !isGuestMessage
    ? extractPassCtaFromMessageBody(rawBody)
    : { text: rawBody, ctaLabel: null, ctaUrl: null };
  const body = passCta.text || rawBody;
  const sourceLabel =
    !isError && !isGuestMessage ? automationSourceLabel(message) : null;
  const isStackEnd = stackPosition === "single" || stackPosition === "last";
  const rowSpacing =
    stackPosition === "first" || stackPosition === "middle" ? "mb-1.5" : "mb-3";

  const rowClass = isGuestMessage
    ? `flex w-full justify-start px-3 sm:px-4 ${rowSpacing}`
    : `flex w-full justify-end px-3 sm:px-4 ${rowSpacing}`;

  let bubbleClass =
    "relative max-w-[min(28rem,82%)] overflow-visible text-left px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.08)] sm:px-3.5 sm:py-2.5";

  if (isError) {
    bubbleClass += " rounded-2xl bg-red-50 text-red-800 ring-1 ring-red-100";
  } else if (isGuestMessage) {
    bubbleClass += ` bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)] ${guestBubbleRadius(stackPosition)}`;
  } else {
    bubbleClass += ` bg-[#eef1f5] text-[#111827] ring-1 ring-black/[0.03] ${outboundBubbleRadius(stackPosition)}`;
  }

  const textClass = isGuestMessage
    ? "break-words [overflow-wrap:anywhere] whitespace-pre-wrap text-[15px] font-normal leading-[1.4] tracking-[-0.01em] text-white"
    : "break-words [overflow-wrap:anywhere] whitespace-pre-wrap text-[15px] font-normal leading-[1.4] tracking-[-0.01em] text-[#111827]";

  const timeClass = isGuestMessage
    ? "shrink-0 text-[11px] font-normal text-blue-100"
    : "shrink-0 text-[11px] font-normal text-zinc-400";

  const linkClass = isGuestMessage
    ? "font-medium text-blue-50 underline decoration-blue-200/80 underline-offset-2"
    : "font-medium text-[#1877f2] underline decoration-[#1877f2]/30 underline-offset-2 transition hover:text-[#166fe0]";

  return (
    <div className={rowClass}>
      <article className={bubbleClass}>
        {isStackEnd && !isError ? (
          <BubbleTail
            side={isGuestMessage ? "left" : "right"}
            className={isGuestMessage ? "text-[#1877f2]" : "text-[#eef1f5]"}
          />
        ) : null}

        <div className="relative z-[1] min-w-0">
          {sourceLabel ? (
            <div className="mb-1.5">
              <GuestChatAutomationBadge label={sourceLabel} compact />
            </div>
          ) : null}
          {body ? (
            <LinkifiedText
              text={body}
              className={textClass}
              linkClassName={linkClass}
            />
          ) : null}
          {passCta.ctaUrl ? (
            <a
              href={passCta.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2.5 inline-flex items-center justify-center rounded-lg bg-[#1877f2] px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#166fe5] ${body ? "" : "mt-0"}`}
            >
              {passCta.ctaLabel || "View my pass"}
            </a>
          ) : null}
          <div className="mt-1.5 flex items-center justify-end">
            <time className={timeClass}>{formatTimeShort(message.sentAt)}</time>
          </div>
        </div>
      </article>
    </div>
  );
}
