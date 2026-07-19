import type {
  ConversationMessage,
  ConversationMessageKind,
} from "@/app/services/chat/get-business-conversation";
import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_CHAT_EVENT = {
  CONVERSATION_UPDATED: "chat-conversation-updated",
  MESSAGE_SENT: "chat-message-sent",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessConversationsChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-conversations-${businessId}`;
}

export function pusherConversationMessagesChannel(
  businessId: number,
  conversationId: number,
): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-conversation-messages-${businessId}-${conversationId}`;
}

export type ChatMessagePusherPayload = {
  businessId: number;
  conversationId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  message: ConversationMessage;
  lastMessagePreview: string;
  lastMessageChannel: ConversationMessageKind;
  lastMessageAt: string;
  messageCount: number;
};

function parseParticipant(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const type = row.type;
  const id = Number(row.id);
  if ((type !== "restaurant" && type !== "customer") || !Number.isFinite(id)) {
    return null;
  }

  return {
    type,
    id,
    name: row.name == null ? null : String(row.name),
    email: row.email == null ? null : String(row.email),
  } as ConversationMessage["sentBy"];
}

function parseMessageKind(value: unknown): ConversationMessageKind {
  if (
    value === "email" ||
    value === "sms" ||
    value === "whatsapp" ||
    value === "system" ||
    value === "error"
  ) {
    return value;
  }
  return "email";
}

function parseIsoTimestamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

export function parseChatMessagePusherPayload(
  data: unknown,
): ChatMessagePusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const businessId = Number(row.businessId ?? row.restaurantId);
  const customerId = Number(row.customerId);
  const messageRaw = row.message;
  const messageConversationId =
    messageRaw && typeof messageRaw === "object"
      ? Number((messageRaw as Record<string, unknown>).conversationId)
      : NaN;
  const conversationId = Number(
    row.conversationId ??
      (Number.isFinite(messageConversationId) ? messageConversationId : NaN),
  );
  if (!Number.isFinite(businessId) || businessId < 1) return null;
  if (!Number.isFinite(conversationId) || conversationId < 1) return null;
  if (!Number.isFinite(customerId) || customerId < 1) return null;

  if (!messageRaw || typeof messageRaw !== "object") return null;
  const messageRow = messageRaw as Record<string, unknown>;
  const messageId = Number(messageRow.id);
  const sentAt = parseIsoTimestamp(messageRow.sentAt);
  if (!Number.isFinite(messageId) || messageId < 1) return null;
  if (!sentAt) return null;

  const direction = messageRow.direction;
  if (direction !== "outbound" && direction !== "inbound" && direction !== "system") return null;

  const lastMessageAt = parseIsoTimestamp(row.lastMessageAt);
  if (!lastMessageAt) return null;

  const funnelIdRaw = Number(messageRow.funnelId);
  const funnelId =
    Number.isFinite(funnelIdRaw) && funnelIdRaw > 0 ? funnelIdRaw : null;

  return {
    businessId,
    conversationId,
    customerId,
    customerName: row.customerName == null ? null : String(row.customerName),
    customerEmail: row.customerEmail == null ? null : String(row.customerEmail),
    message: {
      id: messageId,
      kind: parseMessageKind(messageRow.kind),
      direction,
      sentBy: parseParticipant(messageRow.sentBy),
      sentTo: parseParticipant(messageRow.sentTo),
      body: String(messageRow.body ?? "").trim() || "Message sent",
      stepType:
        messageRow.stepType == null ? null : String(messageRow.stepType),
      sentAt,
      error: messageRow.error == null ? null : String(messageRow.error),
      automationName:
        messageRow.automationName == null
          ? null
          : String(messageRow.automationName).trim() || null,
      campaignName:
        messageRow.campaignName == null
          ? null
          : String(messageRow.campaignName).trim() || null,
      funnelName:
        messageRow.funnelName == null
          ? null
          : String(messageRow.funnelName).trim() || null,
      funnelId,
    },
    lastMessagePreview: String(row.lastMessagePreview ?? "").trim(),
    lastMessageChannel: parseMessageKind(row.lastMessageChannel),
    lastMessageAt,
    messageCount: Number(row.messageCount) || 0,
  };
}
