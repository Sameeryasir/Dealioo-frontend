import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";
import type { AutomationExecutionStatus } from "@/app/services/automation/types";

export type ConversationMessageKind =
  | "email"
  | "sms"
  | "whatsapp"
  | "system"
  | "error";

export type ConversationMessageDirection = "outbound" | "inbound" | "system";

export type ConversationMessageParticipant = {
  type: "restaurant" | "customer";
  id: number;
  name: string | null;
  email: string | null;
};

export type ConversationMessage = {
  id: number;
  kind: ConversationMessageKind;
  direction: ConversationMessageDirection;
  sentBy: ConversationMessageParticipant | null;
  sentTo: ConversationMessageParticipant | null;
  body: string;
  stepType: string | null;
  sentAt: string;
  error: string | null;
};

export type ConversationDetail = {
  executionId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  automationId: number;
  automationName: string;
  status: AutomationExecutionStatus;
  stepType: string | null;
  scheduledAt: string | null;
  startedAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
};

export type GuestConversation = {
  conversationId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  lastMessagePreview: string;
  lastMessageChannel: ConversationMessageKind | null;
  lastMessageAt: string | null;
  lastAutomationName: string | null;
  createdAt: string;
};

export type CustomerConversationMessages = {
  conversationId: number;
  customerId: number;
  messages: ConversationMessage[];
};

export type CustomerConversationDetail = {
  conversationId?: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messages: ConversationMessage[];
};

export async function getRestaurantConversation(
  restaurantId: number,
  executionId: number,
): Promise<ConversationDetail> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(executionId)) {
    throw new Error("Valid execution id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/conversations/${encodeURIComponent(String(executionId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load this conversation."),
    );
  }

  return (await res.json()) as ConversationDetail;
}

export async function getGuestConversation(
  restaurantId: number,
  conversationId: number,
): Promise<GuestConversation> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(conversationId)) {
    throw new Error("Valid conversation id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/conversation/${encodeURIComponent(String(conversationId))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load this conversation."),
    );
  }

  return (await res.json()) as GuestConversation;
}

export async function getCustomerConversationMessages(
  restaurantId: number,
  customerId: number,
): Promise<CustomerConversationMessages> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(customerId)) {
    throw new Error("Valid customer id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/customers/${encodeURIComponent(String(customerId))}/messages`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load this conversation."),
    );
  }

  return (await res.json()) as CustomerConversationMessages;
}

export async function getCustomerConversation(
  restaurantId: number,
  _conversationId: number,
  customerId: number,
): Promise<CustomerConversationDetail> {
  const chats = await getCustomerConversationMessages(restaurantId, customerId);

  return {
    conversationId: chats.conversationId,
    customerId: chats.customerId,
    customerName: null,
    customerEmail: null,
    messages: chats.messages,
  };
}

export async function syncCustomerConversationMessages(
  restaurantId: number,
  customerId: number,
  afterMessageId: number,
): Promise<CustomerConversationMessages> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid business id is required.");
  }
  if (!isPositiveInt(customerId)) {
    throw new Error("Valid customer id is required.");
  }
  if (!isPositiveInt(afterMessageId)) {
    throw new Error("Valid after message id is required.");
  }

  const query = new URLSearchParams({
    afterMessageId: String(afterMessageId),
  });

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/business/${encodeURIComponent(String(restaurantId))}/customers/${encodeURIComponent(String(customerId))}/messages/sync?${query.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not sync this conversation."),
    );
  }

  return (await res.json()) as CustomerConversationMessages;
}
