import type {
  ConversationMessage,
  ConversationMessageKind,
} from "@/app/services/chat/get-restaurant-conversation";
import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_CHAT_EVENT = {
  MESSAGE_SENT: "chat-message-sent",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherRestaurantChatChannel(restaurantId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}restaurant-chat-${restaurantId}`;
}

export type ChatMessagePusherPayload = {
  restaurantId: number;
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

  const restaurantId = Number(row.restaurantId);
  const customerId = Number(row.customerId);
  if (!Number.isFinite(restaurantId) || restaurantId < 1) return null;
  if (!Number.isFinite(customerId) || customerId < 1) return null;

  const messageRaw = row.message;
  if (!messageRaw || typeof messageRaw !== "object") return null;
  const messageRow = messageRaw as Record<string, unknown>;
  const messageId = Number(messageRow.id);
  const sentAt = parseIsoTimestamp(messageRow.sentAt);
  if (!Number.isFinite(messageId) || messageId < 1) return null;
  if (!sentAt) return null;

  const direction = messageRow.direction;
  if (direction !== "outbound" && direction !== "system") return null;

  const lastMessageAt = parseIsoTimestamp(row.lastMessageAt);
  if (!lastMessageAt) return null;

  return {
    restaurantId,
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
    },
    lastMessagePreview: String(row.lastMessagePreview ?? "").trim(),
    lastMessageChannel: parseMessageKind(row.lastMessageChannel),
    lastMessageAt,
    messageCount: Number(row.messageCount) || 0,
  };
}
