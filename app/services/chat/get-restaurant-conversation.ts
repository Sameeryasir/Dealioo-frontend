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

export type ConversationMessageDirection = "outbound" | "system";

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

export type CustomerConversationDetail = {
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
    throw new Error("Valid restaurant id is required.");
  }
  if (!isPositiveInt(executionId)) {
    throw new Error("Valid execution id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/conversations/${encodeURIComponent(String(executionId))}`,
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

export async function getCustomerConversation(
  restaurantId: number,
  customerId: number,
): Promise<CustomerConversationDetail> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(restaurantId)) {
    throw new Error("Valid restaurant id is required.");
  }
  if (!isPositiveInt(customerId)) {
    throw new Error("Valid customer id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/chat/restaurant/${encodeURIComponent(String(restaurantId))}/customers/${encodeURIComponent(String(customerId))}/messages`,
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

  return (await res.json()) as CustomerConversationDetail;
}
