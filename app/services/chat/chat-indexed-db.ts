/**
 * Change summary:
 * - What: Removed shared `customers` list store. Each guest thread uses its own IndexedDB
 *   named `dealioo-chat-{businessId}-{customerId}` with a `messages` store.
 * - Why: Guest list should not live in IndexedDB; messaging cache is per conversation.
 * - Related: use-business-chat-customers-query (API-only list), clear-retention-indexed-db.
 */

import { CHAT_USE_INDEXED_DB } from "@/app/services/chat/chat-cache-mode";
import type { ChatMessagePusherPayload } from "@/app/lib/pusher-chat";
import { sanitizeChatMessageBody } from "@/app/lib/strip-email-signoff-for-chat";
import {
  appendConversationMessage,
  patchConversationFromPusher,
} from "@/app/services/chat/chat-query-cache";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import type {
  ConversationMessage,
  CustomerConversationDetail,
} from "@/app/services/chat/get-business-conversation";

// --- Per-conversation messaging DB (one IndexedDB database per guest thread) ---
const MESSAGE_STORE = "messages";
const MESSAGE_DB_VERSION = 1;
const THREAD_KEY = "thread";

export const CHAT_MESSAGE_PAGE_SIZE = 10;

/** Prefix used so clear tools can find every conversation DB. */
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
  restaurantId: number;
  customerId: number;
  data: CustomerConversationDetail;
  updatedAt: string;
};

type ConversationListener = (
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) => void;

const conversationMessageCache = new Map<string, ConversationMessageCacheEntry>();
const conversationListeners = new Set<ConversationListener>();

function conversationCacheKey(restaurantId: number, customerId: number) {
  return `${restaurantId}:${customerId}`;
}

/** One IndexedDB database per conversation, e.g. dealioo-chat-155-203 */
export function conversationMessageDbName(
  restaurantId: number,
  customerId: number,
): string {
  return `${DEALIOO_CHAT_DB_PREFIX}${restaurantId}-${customerId}`;
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
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  const sanitized = sanitizeStoredConversation(conversation);
  conversationMessageCache.set(conversationCacheKey(restaurantId, customerId), {
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
    lastMessageId: entry.messages.at(-1)?.id ?? null,
  };
}

function deleteLegacySharedChatDatabases(): void {
  if (typeof indexedDB === "undefined") {
    return;
  }
  // Old shared DBs that held a `customers` table — no longer used.
  for (const name of ["dealioo-chat", "retention-chat"]) {
    try {
      indexedDB.deleteDatabase(name);
    } catch {
      // best-effort
    }
  }
}

function openConversationMessageDb(
  restaurantId: number,
  customerId: number,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    deleteLegacySharedChatDatabases();

    const request = indexedDB.open(
      conversationMessageDbName(restaurantId, customerId),
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
  restaurantId: number,
  customerId: number,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openConversationMessageDb(restaurantId, customerId).then(
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
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
) {
  for (const listener of conversationListeners) {
    listener(restaurantId, customerId, conversation);
  }
}

export function subscribeChatConversation(listener: ConversationListener) {
  conversationListeners.add(listener);
  return () => {
    conversationListeners.delete(listener);
  };
}

async function getStoredChatConversationRecord(
  restaurantId: number,
  customerId: number,
): Promise<ConversationRecord | undefined> {
  return runConversationTransaction<ConversationRecord | undefined>(
    restaurantId,
    customerId,
    "readonly",
    (store) => store.get(THREAD_KEY),
  );
}

export async function getStoredChatConversation(
  restaurantId: number,
  customerId: number,
): Promise<CustomerConversationDetail | null> {
  try {
    const record = await getStoredChatConversationRecord(restaurantId, customerId);
    return record?.data ? sanitizeStoredConversation(record.data) : null;
  } catch {
    return null;
  }
}

async function loadConversationMessageCache(
  restaurantId: number,
  customerId: number,
): Promise<ConversationMessageCacheEntry | null> {
  const key = conversationCacheKey(restaurantId, customerId);
  const cached = conversationMessageCache.get(key);
  if (cached) {
    return cached;
  }

  const record = await getStoredChatConversationRecord(restaurantId, customerId);
  if (!record) {
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
  restaurantId: number,
  customerId: number,
): StoredChatMessagePage | null {
  const entry = conversationMessageCache.get(
    conversationCacheKey(restaurantId, customerId),
  );
  if (!entry) {
    return null;
  }

  return buildMessagePage(entry, 0);
}

/**
 * Warm in-memory cache from any already-open per-conversation DBs for this business.
 * Uses indexedDB.databases() when available.
 */
export async function warmRestaurantConversationMessageCache(
  restaurantId: number,
): Promise<void> {
  if (restaurantId < 1 || typeof indexedDB === "undefined") {
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

    const prefix = `${DEALIOO_CHAT_DB_PREFIX}${restaurantId}-`;
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
      const stored = await getStoredChatConversation(restaurantId, customerId);
      if (stored) {
        setConversationMessageCacheEntry(restaurantId, customerId, stored);
      }
    }
  } catch {
    // best-effort warm
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

export async function saveChatConversation(
  restaurantId: number,
  customerId: number,
  conversation: CustomerConversationDetail,
): Promise<void> {
  const sanitized = sanitizeStoredConversation({
    ...conversation,
    customerId,
  });
  const record: ConversationRecord = {
    key: THREAD_KEY,
    restaurantId,
    customerId,
    data: sanitized,
    updatedAt: new Date().toISOString(),
  };

  await runConversationTransaction<IDBValidKey>(
    restaurantId,
    customerId,
    "readwrite",
    (store) => store.put(record),
  );
  setConversationMessageCacheEntry(restaurantId, customerId, sanitized);
  notifyConversationListeners(restaurantId, customerId, sanitized);
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

/** Guest list is no longer stored in IndexedDB — kept as a no-op for callers. */
export async function patchChatCustomersFromPusherInIndexedDb(
  _restaurantId: number,
  _payload: ChatMessagePusherPayload,
): Promise<void> {
  return;
}

/** Guest list is no longer stored in IndexedDB — kept as a no-op for callers. */
export async function patchChatCustomersAfterSendInIndexedDb(
  _restaurantId: number,
  _guest: ChatCustomer,
  _message: ConversationMessage,
): Promise<void> {
  return;
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

/**
 * Delete every per-conversation message DB for one business
 * (e.g. dealioo-chat-155-204 … dealioo-chat-155-223).
 */
export async function clearConversationMessageDatabasesForBusiness(
  restaurantId: number,
): Promise<void> {
  if (restaurantId < 1 || typeof indexedDB === "undefined") {
    return;
  }

  // Drop in-memory entries for this business too.
  for (const key of [...conversationMessageCache.keys()]) {
    if (key.startsWith(`${restaurantId}:`)) {
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

  const prefix = `${DEALIOO_CHAT_DB_PREFIX}${restaurantId}-`;
  try {
    const dbs = await databasesFn.call(indexedDB);
    await Promise.all(
      dbs
        .map((info) => info.name)
        .filter((name): name is string => !!name && name.startsWith(prefix))
        .map((name) => deleteIndexedDbByName(name)),
    );
  } catch {
    // best-effort
  }
}

/**
 * Keep only message DBs for guests that still exist; drop the rest.
 */
export async function pruneConversationMessageDatabases(
  restaurantId: number,
  keepCustomerIds: number[],
): Promise<void> {
  if (restaurantId < 1 || typeof indexedDB === "undefined") {
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

  const prefix = `${DEALIOO_CHAT_DB_PREFIX}${restaurantId}-`;
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
            conversationCacheKey(restaurantId, customerId),
          );
          await deleteIndexedDbByName(name);
        }),
    );
  } catch {
    // best-effort
  }
}
