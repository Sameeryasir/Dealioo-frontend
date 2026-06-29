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
const DB_VERSION = 2;
const CONVERSATIONS_STORE = "conversations";
const CUSTOMERS_STORE = "customers";

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

function openChatDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(CUSTOMERS_STORE)) {
        db.createObjectStore(CUSTOMERS_STORE, { keyPath: "key" });
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
    const record = await runTransaction<ConversationRecord | undefined>(
      CONVERSATIONS_STORE,
      "readonly",
      (store) => store.get(conversationKey(restaurantId, customerId)),
    );

    return record?.data ?? null;
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

  const previous =
    (await getStoredChatConversation(restaurantId, customerId)) ?? undefined;
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
