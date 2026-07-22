import { customerLabel } from "@/app/components/automation/execution-status-ui";
import {
  sanitizeChatMessageBody,
  sanitizeChatMessagePreview,
} from "@/app/lib/strip-email-signoff-for-chat";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import type {
  ConversationMessage,
  ConversationMessageKind,
  ConversationMessageParticipant,
} from "@/app/services/chat/get-business-conversation";

export const CHAT_MESSAGE_PAGE_SIZE = 10;

export type GuestChatBubbleStackPosition = "single" | "first" | "middle" | "last";

export function isGuestInboundMessage(message: ConversationMessage): boolean {
  return (
    message.direction === "inbound" || message.sentBy?.type === "customer"
  );
}

export function getMessageStackPositions(
  messages: ConversationMessage[],
): GuestChatBubbleStackPosition[] {
  return messages.map((message, index) => {
    const isGuest = isGuestInboundMessage(message);
    const prevSame =
      index > 0 && isGuestInboundMessage(messages[index - 1]!) === isGuest;
    const nextSame =
      index < messages.length - 1 &&
      isGuestInboundMessage(messages[index + 1]!) === isGuest;

    if (!prevSame && !nextSame) {
      return "single";
    }
    if (!prevSame && nextSame) {
      return "first";
    }
    if (prevSame && nextSame) {
      return "middle";
    }
    return "last";
  });
}

export function getLatestMessageWindow(
  messages: ConversationMessage[],
): {
  window: ConversationMessage[];
  startIndex: number;
  hasOlder: boolean;
} {
  return { window: messages, startIndex: 0, hasOlder: false };
}

export function getOlderMessageWindow(
  messages: ConversationMessage[],
  currentStartIndex: number,
  pageSize = CHAT_MESSAGE_PAGE_SIZE,
): {
  window: ConversationMessage[];
  startIndex: number;
  hasOlder: boolean;
} {
  if (currentStartIndex <= 0) {
    return { window: messages, startIndex: 0, hasOlder: false };
  }

  const startIndex = Math.max(0, currentStartIndex - pageSize);
  return {
    window: messages.slice(startIndex),
    startIndex,
    hasOlder: startIndex > 0,
  };
}

export function guestDisplayName(row: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">): string {
  if (row.customerName?.trim()) return row.customerName.trim();
  if (row.customerEmail?.trim()) return row.customerEmail.trim();
  return `Guest #${row.customerId}`;
}

export function guestEmailLine(row: Pick<ChatCustomer, "customerName" | "customerEmail" | "lastAutomationName">): string | null {
  if (row.customerEmail?.trim()) return row.customerEmail.trim();
  if (row.customerName?.trim() && row.lastAutomationName) return row.lastAutomationName;
  return null;
}

export function guestSecondaryLine(row: Pick<ChatCustomer, "customerName" | "customerEmail" | "lastAutomationName">): string | null {
  if (row.customerName?.trim() && row.customerEmail?.trim()) return row.customerEmail.trim();
  return row.lastAutomationName;
}

export function chatCustomerLabel(row: ChatCustomer): string {
  return customerLabel(row.customerId, {
    email: row.customerEmail ?? undefined,
    name: row.customerName ?? undefined,
  });
}

export function guestInitials(row: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">): string {
  const name = row.customerName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const email = row.customerEmail?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "G";
}

export function matchesSearch(row: ChatCustomer, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    row.customerName,
    row.customerEmail,
    row.lastAutomationName,
    row.lastMessagePreview,
    chatCustomerLabel(row),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

/** Sidebar-style navy blue — visibly blue, not black. */
export function guestAvatarSidebarClass(): string {
  return "from-[#12325f] via-[#15407a] to-[#1a4f8f] shadow-[0_4px_14px_rgba(24,119,242,0.28)] ring-[#1877f2]/35";
}

export function channelGradientClass(channel: ConversationMessageKind | null | undefined): string {
  switch (channel) {
    case "email":
      return guestAvatarSidebarClass();
    case "sms":
      return guestAvatarSidebarClass();
    case "whatsapp":
      return guestAvatarSidebarClass();
    default:
      return guestAvatarSidebarClass();
  }
}

export function channelLabel(channel: ConversationMessageKind | null | undefined): string {
  switch (channel) {
    case "email":
      return "Email";
    case "sms":
      return "SMS";
    case "whatsapp":
      return "WhatsApp";
    default:
      return "Message";
  }
}

export function truncateListPreview(text: string, maxLength = 72): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "No message yet";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

export function listItemPreview(row: ChatCustomer): string {
  return truncateListPreview(sanitizeChatMessagePreview(row.lastMessagePreview));
}

export function messagePreview(message: ConversationMessage): string {
  return sanitizeChatMessageBody(message.body);
}

/** Pull "View my pass: url" out of chat text so we can show a button instead (no duplicate line). */
export function extractPassCtaFromMessageBody(body: string): {
  text: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
} {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let ctaLabel: string | null = null;
  let ctaUrl: string | null = null;
  const kept: string[] = [];

  for (const line of lines) {
    const match = line
      .trim()
      .match(/^(View my pass|View your pass online|Open link)\s*:\s*(https?:\/\/\S+)\s*$/i);
    if (match && !ctaUrl) {
      ctaLabel = match[1] ?? "View my pass";
      ctaUrl = match[2] ?? null;
      continue;
    }
    kept.push(line);
  }

  const text = kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, ctaLabel, ctaUrl };
}

export function participantLabel(
  participant: ConversationMessageParticipant | null,
  fallback: string,
): string {
  if (!participant) return fallback;
  if (participant.type === "restaurant") {
    return participant.name?.trim() || `Business #${participant.id}`;
  }
  return participant.name?.trim() || participant.email?.trim() || `Guest #${participant.id}`;
}

export function messageRouteLabel(message: ConversationMessage): string {
  const from = participantLabel(message.sentBy, "Business");
  const to = participantLabel(message.sentTo, "Guest");
  return `${from} → ${to}`;
}

export function messageKindLabel(kind: ConversationMessage["kind"]): string {
  switch (kind) {
    case "email":
      return "Email sent";
    case "sms":
      return "Text sent";
    case "whatsapp":
      return "WhatsApp sent";
    case "error":
      return "Error";
    default:
      return "Automation update";
  }
}

export function formatMessageDayLabel(sentAt: string): string {
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return "Messages";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function messageDayBucketKey(sentAt: string): string {
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupMessagesByDay(
  messages: ConversationMessage[],
): Array<{ day: string; dayKey: string; messages: ConversationMessage[] }> {
  const sorted = [...messages].sort((a, b) => {
    const timeDiff =
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return a.id - b.id;
  });

  const groups: Array<{ day: string; dayKey: string; messages: ConversationMessage[] }> =
    [];
  const indexByDayKey = new Map<string, number>();

  for (const message of sorted) {
    const dayKey = messageDayBucketKey(message.sentAt);
    const existingIndex = indexByDayKey.get(dayKey);
    if (existingIndex != null) {
      groups[existingIndex]!.messages.push(message);
      continue;
    }

    indexByDayKey.set(dayKey, groups.length);
    groups.push({
      dayKey,
      day: formatMessageDayLabel(message.sentAt),
      messages: [message],
    });
  }

  return groups;
}

export function exportConversationText(
  guestName: string,
  messages: ConversationMessage[],
): string {
  const lines = [`Conversation with ${guestName}`, ""];
  for (const message of messages) {
    lines.push(`[${message.sentAt}] ${messageRouteLabel(message)} — ${messageKindLabel(message.kind)}`);
    lines.push(messagePreview(message));
    lines.push("");
  }
  return lines.join("\n");
}
