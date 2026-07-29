import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";

export type AiConversationSummary = {
  id: string;
  title: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiConversationCreated = {
  id: string;
  title: string;
  businessId: number;
  funnelId: number;
  createdAt: string;
};

export type AiMessagePageId =
  | "landing"
  | "signup"
  | "payment"
  | "confirmation";

export type AiChatMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  pageId: AiMessagePageId | null;
  status: string;
  jobId: string | null;
  schemaPatch: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  conversationTitle?: string;
};

export type AiMessagesPageResponse = {
  data: AiChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

export async function createAiConversation(input: {
  businessId: number;
  funnelId: number;
}): Promise<AiConversationCreated> {
  const res = await authenticatedFetch(`${getApiBaseUrl()}/ai/conversations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessId: input.businessId,
      funnelId: input.funnelId,
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not create AI conversation."),
    );
  }

  return (await res.json()) as AiConversationCreated;
}

export async function listAiConversationsByFunnel(
  funnelId: number,
): Promise<AiConversationSummary[]> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/conversations/funnel/${funnelId}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load AI conversations."),
    );
  }

  return (await res.json()) as AiConversationSummary[];
}

export async function deleteAiConversation(
  conversationId: string,
): Promise<void> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not delete AI conversation."),
    );
  }
}

export async function createAiMessage(input: {
  conversationId: string;
  content: string;
  pageId?: AiMessagePageId;
  role?: "user" | "assistant";
}): Promise<AiChatMessage> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/conversations/${input.conversationId}/messages`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: input.content,
        ...(input.pageId ? { pageId: input.pageId } : {}),
        ...(input.role ? { role: input.role } : {}),
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not save AI message."),
    );
  }

  return (await res.json()) as AiChatMessage;
}

export async function listAiMessages(input: {
  conversationId: string;
  page?: number;
  limit?: number;
}): Promise<AiMessagesPageResponse> {
  const page = input.page ?? 1;
  const limit = input.limit ?? 50;
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/conversations/${input.conversationId}/messages?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load AI messages."),
    );
  }

  return (await res.json()) as AiMessagesPageResponse;
}

export type AiMessagesAfterResponse = {
  data: AiChatMessage[];
  hasMore: boolean;
};

export async function listAiMessagesAfter(input: {
  conversationId: string;
  lastMessageId?: string;
  limit?: number;
}): Promise<AiMessagesAfterResponse> {
  const limit = input.limit ?? 20;
  const params = new URLSearchParams({ limit: String(limit) });
  if (input.lastMessageId) {
    params.set("lastMessageId", input.lastMessageId);
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/conversations/${input.conversationId}/messages/after?${params.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load AI messages."),
    );
  }

  const json = (await res.json()) as AiMessagesAfterResponse | AiChatMessage[];
  if (Array.isArray(json)) {
    return {
      data: json,
      hasMore: json.length === limit,
    };
  }

  return {
    data: json.data ?? [],
    hasMore: Boolean(json.hasMore),
  };
}

export async function listAllAiMessagesAfter(input: {
  conversationId: string;
  lastMessageId: string;
  limit?: number;
}): Promise<AiChatMessage[]> {
  const limit = input.limit ?? 20;
  const collected: AiChatMessage[] = [];
  let lastMessageId: string | undefined = input.lastMessageId;

  while (lastMessageId) {
    const page = await listAiMessagesAfter({
      conversationId: input.conversationId,
      lastMessageId,
      limit,
    });

    if (page.data.length === 0) {
      break;
    }

    collected.push(...page.data);
    lastMessageId = page.data[page.data.length - 1]?.id;

    if (!page.hasMore || page.data.length < limit) {
      break;
    }
  }

  return collected;
}
