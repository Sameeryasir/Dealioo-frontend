import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import {
  appendConversationMessage,
  patchChatCustomersAfterSend,
  patchChatCustomersFromPusher,
  patchConversationFromPusher,
} from "@/app/services/chat/chat-query-cache";
import type {
  ChatCustomer,
  PaginatedChatCustomersResponse,
} from "@/app/services/chat/get-restaurant-chat-customers";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-restaurant-conversation";

const DB_NAME = "retention-chat";
const DB_VERSION = 4;
const CONVERSATIONS_STORE = "conversations";
const CUSTOMERS_STORE = "customers";
const LEGACY_CONVERSATION_LIST_STORE = "conversation-list";
const LEGACY_CONVERSATION_MESSAGES_STORE = "conversation-messages";

export const CHAT_MESSAGE_PAGE_SIZE = 10;

export type StoredChatMessagePage = {
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messages: ConversationMessage[];
  startIndex: number;
  totalMessages: number;
  hasOlder: boolean;
  lastMessageId: number | null;
};

type ConversationMessageCacheEntry = {
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  messages: ConversationMessage[];
};

const conversationMessageCache = new Map<string, ConversationMessageCacheEntry>();

function setConversationMessageCacheEntry(
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  conversationMessageCache.set(conversationKey(restaurantId, customerId), {
    customerId: conversation.customerId,
    customerName: conversation.customerName,
    customerEmail: conversation.customerEmail,
    messages: conversation.messages,
  });
}

async function loadConversationMessageCache(
  restaurantId: number,
  customerId: number,
): Promise<ConversationMessageCacheEntry | null> {
  const key = conversationKey(restaurantId, customerId);
  const cached = conversationMessageCache.get(key);
  if (cached) {
    return cached;
  }

  const record = await getStoredChatConversationRecord(restaurantId, customerId);
  if (!record) {
    return null;
  }

  const entry: ConversationMessageCacheEntry = {
    customerId: record.data.customerId,
    customerName: record.data.customerName,
    customerEmail: record.data.customerEmail,
    messages: record.data.messages,
  };
  conversationMessageCache.set(key, entry);
  return entry;
}

function buildMessagePage(
  entry: ConversationMessageCacheEntry,
  startIndex: number,
): StoredChatMessagePage {
  return {
    customerId: entry.customerId,
    customerName: entry.customerName,
    customerEmail: entry.customerEmail,
    messages: entry.messages.slice(startIndex),
    startIndex,
    totalMessages: entry.messages.length,
    hasOlder: startIndex > 0,
    lastMessageId: entry.messages.at(-1)?.id ?? null,
  };
}

type ConversationRecord = {
  key: string;
  restaurantId: number;
  customerId: number;
  data: CustomerConversationDetail;
  updatedAt: string;
};

type CustomersRecord = {
  key: string;
  restaurantId: number;
  page: number;
  data: PaginatedChatCustomersResponse;
  updatedAt: string;
};

type ConversationListener = (
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) => void;

type CustomersListener = (
  restaurantId: number,
  page: number,
  customers: PaginatedChatCustomersResponse,
) => void;

const conversationListeners = new Set<ConversationListener>();
const customersListeners = new Set<CustomersListener>();

function conversationKey(restaurantId: number, customerId: number) {
  return `${restaurantId}:${customerId}`;
}

function customersKey(restaurantId: number, page: number) {
  return `${restaurantId}:${page}`;
}

function migrateObjectStore(
  transaction: IDBTransaction,
  fromStore: string,
  toStore: string,
): void {
  const source = transaction.objectStore(fromStore);
  const target = transaction.objectStore(toStore);
  const request = source.getAll();

  request.onsuccess = () => {
    for (const record of request.result) {
      target.put(record);
    }
  };
}

function openChatDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const transaction = request.transaction;

      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        db.createObjectStore(CUSTOMERS_STORE, { keyPath: "key" });
      }

      if (event.oldVersion < 4 && transaction) {
        if (db.objectStoreNames.contains(LEGACY_CONVERSATION_LIST_STORE)) {
          migrateObjectStore(
            transaction,
            LEGACY_CONVERSATION_LIST_STORE,
            CUSTOMERS_STORE,
          );
          db.deleteObjectStore(LEGACY_CONVERSATION_LIST_STORE);
        }
        if (db.objectStoreNames.contains(LEGACY_CONVERSATION_MESSAGES_STORE)) {
          migrateObjectStore(
            transaction,
            LEGACY_CONVERSATION_MESSAGES_STORE,
            CONVERSATIONS_STORE,
          );
          db.deleteObjectStore(LEGACY_CONVERSATION_MESSAGES_STORE);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open chat storage."));
  });
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openChatDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("Chat storage request failed."));
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error("Chat storage transaction failed."),
          );
      }),
  );
}

function notifyConversationListeners(
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  for (const listener of conversationListeners) {
    listener(restaurantId, customerId, conversation);
  }
}

function notifyCustomersListeners(
  restaurantId: number,
  page: number,
  customers: PaginatedChatCustomersResponse,
) {
  for (const listener of customersListeners) {
    listener(restaurantId, page, customers);
  }
}

export function subscribeChatConversation(listener: ConversationListener) {
  conversationListeners.add(listener);
  return () => {
    conversationListeners.delete(listener);
  };
}

export function subscribeChatCustomers(listener: CustomersListener) {
  customersListeners.add(listener);
  return () => {
    customersListeners.delete(listener);
  };
}

export async function getStoredChatConversation(
  restaurantId: number,
  customerId: number,
): Promise<CustomerConversationDetail | null> {
  try {
    const record = await getStoredChatConversationRecord(restaurantId, customerId);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

async function getStoredChatConversationRecord(
  restaurantId: number,
  customerId: number,
): Promise<ConversationRecord | undefined> {
  return runTransaction<ConversationRecord | undefined>(
    CONVERSATIONS_STORE,
    "readonly",
    (store) => store.get(conversationKey(restaurantId, customerId)),
  );
}

export function peekStoredChatMessagesLatestPage(
  restaurantId: number,
  customerId: number,
): StoredChatMessagePage | null {
  const entry = conversationMessageCache.get(conversationKey(restaurantId, customerId));
  if (!entry) {
    return null;
  }

  return buildMessagePage(entry, 0);
}

export async function warmRestaurantConversationMessageCache(
  restaurantId: number,
): Promise<void> {
  if (restaurantId < 1) {
    return;
  }

  try {
    const records = await runTransaction<ConversationRecord[]>(
      CONVERSATIONS_STORE,
      "readonly",
      (store) => store.getAll(),
    );

    for (const record of records) {
      if (record.restaurantId !== restaurantId) {
        continue;
      }

      setConversationMessageCacheEntry(
        restaurantId,
        record.customerId,
        record.data,
      );
    }
  } catch {
  }
}

export function prefetchConversationMessageCache(
  restaurantId: number,
  customerId: number,
): void {
  if (restaurantId < 1 || customerId < 1) {
    return;
  }

  void loadConversationMessageCache(restaurantId, customerId);
}

export async function getStoredChatMessagesLatestPage(
  restaurantId: number,
  customerId: number,
): Promise<StoredChatMessagePage | null> {
  try {
    const entry = await loadConversationMessageCache(restaurantId, customerId);
    if (!entry) {
      return null;
    }

    return buildMessagePage(entry, 0);
  } catch {
    return null;
  }
}

export async function getStoredChatMessagesOlderPage(
  restaurantId: number,
  customerId: number,
  beforeStartIndex: number,
  pageSize = CHAT_MESSAGE_PAGE_SIZE,
): Promise<StoredChatMessagePage | null> {
  try {
    const entry = await loadConversationMessageCache(restaurantId, customerId);
    if (!entry || beforeStartIndex <= 0) {
      return null;
    }

    const startIndex = Math.max(0, beforeStartIndex - pageSize);
    return buildMessagePage(entry, startIndex);
  } catch {
    return null;
  }
}

export async function getStoredChatCustomers(
  restaurantId: number,
  page: number,
): Promise<PaginatedChatCustomersResponse | null> {
  try {
    const record = await runTransaction<CustomersRecord | undefined>(
      CUSTOMERS_STORE,
      "readonly",
      (store) => store.get(customersKey(restaurantId, page)),
    );

    return record?.data ?? null;
  } catch {
    return null;
  }
}

async function getAllStoredChatCustomerRecords(
  restaurantId: number,
): Promise<CustomersRecord[]> {
  try {
    const records = await runTransaction<CustomersRecord[]>(
      CUSTOMERS_STORE,
      "readonly",
      (store) => store.getAll(),
    );

    return records.filter((record) => record.restaurantId === restaurantId);
  } catch {
    return [];
  }
}

export async function saveChatConversation(
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
): Promise<void> {
  const record: ConversationRecord = {
    key: conversationKey(restaurantId, customerId),
    restaurantId,
    customerId,
    data: conversation,
    updatedAt: new Date().toISOString(),
  };

  await runTransaction<IDBValidKey>(
    CONVERSATIONS_STORE,
    "readwrite",
    (store) => store.put(record),
  );
  setConversationMessageCacheEntry(restaurantId, customerId, conversation);
  notifyConversationListeners(restaurantId, customerId, conversation);
}

export async function saveChatCustomers(
  restaurantId: number,
  page: number,
  customers: PaginatedChatCustomersResponse,
): Promise<void> {
  const record: CustomersRecord = {
    key: customersKey(restaurantId, page),
    restaurantId,
    page,
    data: customers,
    updatedAt: new Date().toISOString(),
  };

  await runTransaction<IDBValidKey>(
    CUSTOMERS_STORE,
    "readwrite",
    (store) => store.put(record),
  );
  notifyCustomersListeners(restaurantId, page, customers);
}

export async function appendChatConversationMessage(
  restaurantId: number,
  guest: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">,
  message: ConversationMessage,
): Promise<CustomerConversationDetail> {
  const previous =
    (await getStoredChatConversation(restaurantId, guest.customerId)) ??
    undefined;
  const next = appendConversationMessage(previous, message, guest);
  await saveChatConversation(restaurantId, guest.customerId, next);
  return next;
}

export async function patchChatConversationFromPusher(
  restaurantId: number,
  customerId: number,
  payload: ChatMessagePusherPayload,
): Promise<CustomerConversationDetail | null> {
  if (payload.customerId !== customerId) {
    return null;
  }

  const stored = await getStoredChatConversation(restaurantId, customerId);
  const cachedEntry = await loadConversationMessageCache(restaurantId, customerId);
  const previous =
    stored ??
    (cachedEntry
      ? {
          customerId: cachedEntry.customerId,
          customerName: cachedEntry.customerName,
          customerEmail: cachedEntry.customerEmail,
          messages: cachedEntry.messages,
        }
      : undefined);
  const next = patchConversationFromPusher(previous, payload, customerId);

  if (!next) {
    return previous ?? null;
  }

  await saveChatConversation(restaurantId, customerId, next);
  return next;
}

export async function patchChatCustomersFromPusherInIndexedDb(
  restaurantId: number,
  payload: ChatMessagePusherPayload,
): Promise<void> {
  const records = await getAllStoredChatCustomerRecords(restaurantId);

  if (records.length === 0) {
    const next = patchChatCustomersFromPusher(undefined, payload, 1);
    if (next) {
      await saveChatCustomers(restaurantId, 1, next);
    }
    return;
  }

  for (const record of records) {
    const next = patchChatCustomersFromPusher(
      record.data,
      payload,
      record.page,
    );

    if (!next) {
      continue;
    }

    await saveChatCustomers(restaurantId, record.page, next);
  }
}

export async function patchChatCustomersAfterSendInIndexedDb(
  restaurantId: number,
  guest: ChatCustomer,
  message: ConversationMessage,
): Promise<void> {
  const records = await getAllStoredChatCustomerRecords(restaurantId);

  for (const record of records) {
    const next = patchChatCustomersAfterSend(
      record.data,
      guest,
      message,
      record.page,
    );

    if (!next) {
      continue;
    }

    await saveChatCustomers(restaurantId, record.page, next);
  }
}

export async function clearChatIndexedDbCache(): Promise<void> {
  conversationMessageCache.clear();
  const { clearAllRetentionIndexedDb } = await import(
    "@/app/lib/clear-retention-indexed-db"
  );
  await clearAllRetentionIndexedDb();
}
