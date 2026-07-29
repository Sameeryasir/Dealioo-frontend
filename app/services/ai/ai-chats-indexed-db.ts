import type {
  AiChatMessage,
  AiConversationSummary,
} from "@/app/services/ai/ai-conversations";

export const DEALIOO_AI_CHATS_IDB_NAME = "dealioo-ai-chats";
const IDB_VERSION = 1;
const CONVERSATIONS_STORE = "conversations";
const MESSAGES_STORE = "messages";

type StoredConversationsRecord = {
  key: string;
  businessId: number;
  funnelId: number;
  conversations: AiConversationSummary[];
  updatedAt: string;
};

type StoredMessagesRecord = {
  key: string;
  conversationId: string;
  messages: AiChatMessage[];
  updatedAt: string;
};

function conversationsKey(businessId: number, funnelId: number): string {
  return `${businessId}:${funnelId}`;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DEALIOO_AI_CHATS_IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }

        try {
          const tx = db.transaction(storeName, mode);
          const store = tx.objectStore(storeName);
          const request = run(store);
          request.onsuccess = () => {
            resolve(request.result ?? null);
            db.close();
          };
          request.onerror = () => {
            resolve(null);
            db.close();
          };
        } catch {
          resolve(null);
          db.close();
        }
      }),
  );
}

export async function getCachedAiConversations(
  businessId: number,
  funnelId: number,
): Promise<AiConversationSummary[] | null> {
  const record = await runStore<StoredConversationsRecord>(
    CONVERSATIONS_STORE,
    "readonly",
    (store) => store.get(conversationsKey(businessId, funnelId)),
  );
  return record?.conversations ?? null;
}

export async function setCachedAiConversations(input: {
  businessId: number;
  funnelId: number;
  conversations: AiConversationSummary[];
}): Promise<void> {
  const record: StoredConversationsRecord = {
    key: conversationsKey(input.businessId, input.funnelId),
    businessId: input.businessId,
    funnelId: input.funnelId,
    conversations: input.conversations,
    updatedAt: new Date().toISOString(),
  };

  await runStore(CONVERSATIONS_STORE, "readwrite", (store) =>
    store.put(record),
  );
}

export async function upsertCachedAiConversation(input: {
  businessId: number;
  funnelId: number;
  conversation: AiConversationSummary;
}): Promise<void> {
  const existing =
    (await getCachedAiConversations(input.businessId, input.funnelId)) ?? [];
  const without = existing.filter((item) => item.id !== input.conversation.id);
  const next = [input.conversation, ...without].sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.createdAt;
    const bTime = b.lastMessageAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });
  await setCachedAiConversations({
    businessId: input.businessId,
    funnelId: input.funnelId,
    conversations: next,
  });
}

export async function getCachedAiMessages(
  conversationId: string,
): Promise<AiChatMessage[] | null> {
  const record = await runStore<StoredMessagesRecord>(
    MESSAGES_STORE,
    "readonly",
    (store) => store.get(conversationId),
  );
  return record?.messages ?? null;
}

export async function setCachedAiMessages(input: {
  conversationId: string;
  messages: AiChatMessage[];
}): Promise<void> {
  const record: StoredMessagesRecord = {
    key: input.conversationId,
    conversationId: input.conversationId,
    messages: input.messages,
    updatedAt: new Date().toISOString(),
  };

  await runStore(MESSAGES_STORE, "readwrite", (store) => store.put(record));
}

export async function appendCachedAiMessage(input: {
  conversationId: string;
  message: AiChatMessage;
}): Promise<void> {
  const existing = (await getCachedAiMessages(input.conversationId)) ?? [];
  const without = existing.filter((item) => item.id !== input.message.id);
  const next = [...without, input.message].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  await setCachedAiMessages({
    conversationId: input.conversationId,
    messages: next,
  });
}

export async function clearCachedAiMessages(
  conversationId: string,
): Promise<void> {
  await runStore(MESSAGES_STORE, "readwrite", (store) =>
    store.delete(conversationId),
  );
}
