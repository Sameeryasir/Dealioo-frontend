import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { sanitizeChatMessageBody } from "@/app/lib/strip-email-signoff-for-chat";
import {
  appendConversationMessage,
  getMaxMessageId,
  patchConversationFromPusher,
} from "@/app/services/chat/chat-query-cache";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-business-conversation";

const MESSAGE_STORE = "messages";
const MESSAGE_DB_VERSION = 1;
const THREAD_KEY = "thread";

export const CHAT_MESSAGE_PAGE_SIZE = 25;

export const DEALIOO_CHAT_DB_PREFIX = "dealioo-chat-";

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

type ConversationRecord = {
  key: typeof THREAD_KEY;
  businessId: number;
  customerId: number;
  data: CustomerConversationDetail;
  updatedAt: string;
};

type ConversationListener = (
  businessId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) => void;

const conversationMessageCache = new Map<string, ConversationMessageCacheEntry>();
const conversationListeners = new Set<ConversationListener>();

function conversationCacheKey(businessId: number, customerId: number) {
  return `${businessId}:${customerId}`;
}

export function conversationMessageDbName(
  businessId: number,
  customerId: number,
): string {
  return `${DEALIOO_CHAT_DB_PREFIX}${businessId}-${customerId}`;
}

function sanitizeStoredMessage(message: ConversationMessage): ConversationMessage {
  return {
    ...message,
    body: sanitizeChatMessageBody(message.body),
  };
}

function sanitizeStoredConversation(
  conversation: CustomerConversationDetail,
): CustomerConversationDetail {
  return {
    ...conversation,
    messages: conversation.messages.map(sanitizeStoredMessage),
  };
}

function setConversationMessageCacheEntry(
  businessId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  if (conversation.customerId !== customerId) {
    return;
  }

  const sanitized = sanitizeStoredConversation(conversation);
  conversationMessageCache.set(conversationCacheKey(businessId, customerId), {
    customerId: sanitized.customerId,
    customerName: sanitized.customerName,
    customerEmail: sanitized.customerEmail,
    messages: sanitized.messages,
  });
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
    lastMessageId: getMaxMessageId(entry.messages),
  };
}

function buildLatestMessagePage(
  entry: ConversationMessageCacheEntry,
): StoredChatMessagePage {
  const startIndex = Math.max(0, entry.messages.length - CHAT_MESSAGE_PAGE_SIZE);
  return buildMessagePage(entry, startIndex);
}

function deleteLegacySharedChatDatabases(): void {
  if (typeof indexedDB === "undefined") {
    return;
  }
  for (const name of ["dealioo-chat", "retention-chat"]) {
    try {
      indexedDB.deleteDatabase(name);
    } catch {
    }
  }
}

function openConversationMessageDb(
  businessId: number,
  customerId: number,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    deleteLegacySharedChatDatabases();

    const request = indexedDB.open(
      conversationMessageDbName(businessId, customerId),
      MESSAGE_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        db.createObjectStore(MESSAGE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open conversation message storage."));
  });
}

function runConversationTransaction<T>(
  businessId: number,
  customerId: number,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openConversationMessageDb(businessId, customerId).then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(MESSAGE_STORE, mode);
        const store = transaction.objectStore(MESSAGE_STORE);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("Chat storage request failed."));
        transaction.onerror = () =>
          reject(
            transaction.error ?? new Error("Chat storage transaction failed."),
          );
        transaction.oncomplete = () => {
          db.close();
        };
      }),
  );
}

function notifyConversationListeners(
  businessId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  for (const listener of conversationListeners) {
    listener(businessId, customerId, conversation);
  }
}

export function subscribeChatConversation(listener: ConversationListener) {
  conversationListeners.add(listener);
  return () => {
    conversationListeners.delete(listener);
  };
}

async function getStoredChatConversationRecord(
  businessId: number,
  customerId: number,
): Promise<ConversationRecord | undefined> {
  return runConversationTransaction<ConversationRecord | undefined>(
    businessId,
    customerId,
    "readonly",
    (store) => store.get(THREAD_KEY),
  );
}

export async function getStoredChatConversation(
  businessId: number,
  customerId: number,
): Promise<CustomerConversationDetail | null> {
  try {
    const record = await getStoredChatConversationRecord(businessId, customerId);
    if (!record?.data) {
      return null;
    }

    if (
      record.customerId !== customerId ||
      record.data.customerId !== customerId
    ) {
      conversationMessageCache.delete(conversationCacheKey(businessId, customerId));
      return null;
    }

    return sanitizeStoredConversation(record.data);
  } catch {
    return null;
  }
}

async function loadConversationMessageCache(
  businessId: number,
  customerId: number,
): Promise<ConversationMessageCacheEntry | null> {
  const key = conversationCacheKey(businessId, customerId);
  const cached = conversationMessageCache.get(key);
  if (cached) {
    return cached;
  }

  const record = await getStoredChatConversationRecord(businessId, customerId);
  if (!record) {
    return null;
  }

  if (
    record.customerId !== customerId ||
    record.data.customerId !== customerId
  ) {
    conversationMessageCache.delete(conversationCacheKey(businessId, customerId));
    return null;
  }

  const sanitized = sanitizeStoredConversation(record.data);
  const entry: ConversationMessageCacheEntry = {
    customerId: sanitized.customerId,
    customerName: sanitized.customerName,
    customerEmail: sanitized.customerEmail,
    messages: sanitized.messages,
  };
  conversationMessageCache.set(key, entry);
  return entry;
}

export function peekStoredChatMessagesLatestPage(
  businessId: number,
  customerId: number,
): StoredChatMessagePage | null {
  const entry = conversationMessageCache.get(
    conversationCacheKey(businessId, customerId),
  );
  if (!entry || entry.customerId !== customerId) {
    if (entry && entry.customerId !== customerId) {
      conversationMessageCache.delete(conversationCacheKey(businessId, customerId));
    }
    return null;
  }

  return buildLatestMessagePage(entry);
}

export async function warmRestaurantConversationMessageCache(
  businessId: number,
): Promise<void> {
  if (businessId < 1 || typeof indexedDB === "undefined") {
    return;
  }

  deleteLegacySharedChatDatabases();

  try {
    const databasesFn = (
      indexedDB as IDBFactory & {
        databases?: () => Promise<Array<{ name?: string }>>;
      }
    ).databases;

    if (typeof databasesFn !== "function") {
      return;
    }

    const prefix = `${DEALIOO_CHAT_DB_PREFIX}${businessId}-`;
    const dbs = await databasesFn.call(indexedDB);
    for (const info of dbs) {
      const name = info.name;
      if (!name || !name.startsWith(prefix)) {
        continue;
      }
      const customerId = Number(name.slice(prefix.length));
      if (!Number.isFinite(customerId) || customerId < 1) {
        continue;
      }
      const stored = await getStoredChatConversation(businessId, customerId);
      if (stored) {
        setConversationMessageCacheEntry(businessId, customerId, stored);
      }
    }
  } catch {
  }
}

export function prefetchConversationMessageCache(
  businessId: number,
  customerId: number,
): void {
  if (businessId < 1 || customerId < 1) {
    return;
  }

  void loadConversationMessageCache(businessId, customerId);
}

export async function getStoredChatMessagesLatestPage(
  businessId: number,
  customerId: number,
): Promise<StoredChatMessagePage | null> {
  try {
    const entry = await loadConversationMessageCache(businessId, customerId);
    if (!entry) {
      return null;
    }

    return buildLatestMessagePage(entry);
  } catch {
    return null;
  }
}

export async function getStoredChatMessagesOlderPage(
  businessId: number,
  customerId: number,
  beforeStartIndex: number,
  pageSize = CHAT_MESSAGE_PAGE_SIZE,
): Promise<StoredChatMessagePage | null> {
  try {
    const entry = await loadConversationMessageCache(businessId, customerId);
    if (!entry || beforeStartIndex <= 0) {
      return null;
    }

    const startIndex = Math.max(0, beforeStartIndex - pageSize);
    return buildMessagePage(entry, startIndex);
  } catch {
    return null;
  }
}

export async function saveChatConversation(
  businessId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
): Promise<void> {
  if (conversation.customerId !== customerId) {
    return;
  }

  const sanitized = sanitizeStoredConversation({
    ...conversation,
    customerId,
  });
  const record: ConversationRecord = {
    key: THREAD_KEY,
    businessId,
    customerId,
    data: sanitized,
    updatedAt: new Date().toISOString(),
  };

  await runConversationTransaction<IDBValidKey>(
    businessId,
    customerId,
    "readwrite",
    (store) => store.put(record),
  );
  setConversationMessageCacheEntry(businessId, customerId, sanitized);
  notifyConversationListeners(businessId, customerId, sanitized);
}

export async function appendChatConversationMessage(
  businessId: number,
  guest: Pick<ChatCustomer, "customerId" | "customerName" | "customerEmail">,
  message: ConversationMessage,
): Promise<CustomerConversationDetail> {
  const previous =
    (await getStoredChatConversation(businessId, guest.customerId)) ??
    undefined;
  const next = appendConversationMessage(previous, message, guest);
  await saveChatConversation(businessId, guest.customerId, next);
  return next;
}

export async function patchChatConversationFromPusher(
  businessId: number,
  customerId: number,
  payload: ChatMessagePusherPayload,
): Promise<CustomerConversationDetail | null> {
  if (payload.customerId !== customerId) {
    return null;
  }

  const stored = await getStoredChatConversation(businessId, customerId);
  const cachedEntry = await loadConversationMessageCache(businessId, customerId);
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

  await saveChatConversation(businessId, customerId, next);
  return next;
}

export async function patchChatCustomersFromPusherInIndexedDb(
  businessId: number,
  payload: ChatMessagePusherPayload,
): Promise<void> {
  void businessId;
  void payload;
}

export async function patchChatCustomersAfterSendInIndexedDb(
  businessId: number,
  guest: ChatCustomer,
  message: ConversationMessage,
): Promise<void> {
  void businessId;
  void guest;
  void message;
}

export async function clearChatIndexedDbCache(): Promise<void> {
  conversationMessageCache.clear();
  const { clearAllRetentionIndexedDb } = await import(
    "@/app/lib/clear-retention-indexed-db"
  );
  await clearAllRetentionIndexedDb();
}

function deleteIndexedDbByName(name: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function clearConversationMessageDatabasesForBusiness(
  businessId: number,
): Promise<void> {
  if (businessId < 1 || typeof indexedDB === "undefined") {
    return;
  }

  for (const key of [...conversationMessageCache.keys()]) {
    if (key.startsWith(`${businessId}:`)) {
      conversationMessageCache.delete(key);
    }
  }

  deleteLegacySharedChatDatabases();

  const databasesFn = (
    indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    }
  ).databases;

  if (typeof databasesFn !== "function") {
    return;
  }

  const prefix = `${DEALIOO_CHAT_DB_PREFIX}${businessId}-`;
  try {
    const dbs = await databasesFn.call(indexedDB);
    await Promise.all(
      dbs
        .map((info) => info.name)
        .filter((name): name is string => !!name && name.startsWith(prefix))
        .map((name) => deleteIndexedDbByName(name)),
    );
  } catch {
  }
}

export async function pruneConversationMessageDatabases(
  businessId: number,
  keepCustomerIds: number[],
): Promise<void> {
  if (businessId < 1 || typeof indexedDB === "undefined") {
    return;
  }

  const keep = new Set(keepCustomerIds.filter((id) => id > 0));
  const databasesFn = (
    indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    }
  ).databases;

  if (typeof databasesFn !== "function") {
    return;
  }

  const prefix = `${DEALIOO_CHAT_DB_PREFIX}${businessId}-`;
  try {
    const dbs = await databasesFn.call(indexedDB);
    await Promise.all(
      dbs
        .map((info) => info.name)
        .filter((name): name is string => !!name && name.startsWith(prefix))
        .map(async (name) => {
          const customerId = Number(name.slice(prefix.length));
          if (!Number.isFinite(customerId) || keep.has(customerId)) {
            return;
          }
          conversationMessageCache.delete(
            conversationCacheKey(businessId, customerId),
          );
          await deleteIndexedDbByName(name);
        }),
    );
  } catch {
  }
}
