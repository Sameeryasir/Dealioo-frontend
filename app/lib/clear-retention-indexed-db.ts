export const DEALIOO_CHAT_IDB_NAME = "dealioo-chat";
/** @deprecated Old shared chat DB — still deleted on clear. */
export const RETENTION_CHAT_IDB_NAME = "retention-chat";
export const DEALIOO_FUNNEL_TEMPLATE_IDB_NAME = "dealioo-funnel-templates";
/** @deprecated Old name — still deleted on clear. */
export const RETENTION_FUNNEL_TEMPLATE_IDB_NAME = "retention-funnel-templates";

/** Per-conversation DBs are named dealioo-chat-{businessId}-{customerId} */
const DEALIOO_CHAT_MESSAGE_DB_PREFIX = "dealioo-chat-";

export const RETENTION_LOCAL_STORAGE_PREFIXES = [
  "retention:funnel-template:",
  "retention-chat",
  "dealioo-chat",
] as const;

function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }

    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error(`Could not delete ${name}.`));
    request.onblocked = () => resolve();
  });
}

/** Delete every per-conversation DB: dealioo-chat-{businessId}-{customerId} */
async function deleteAllDealiooChatMessageDatabases(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const databasesFn = (
    indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    }
  ).databases;

  if (typeof databasesFn !== "function") {
    return;
  }

  try {
    const dbs = await databasesFn.call(indexedDB);
    await Promise.all(
      dbs
        .map((info) => info.name)
        .filter(
          (name): name is string =>
            !!name && name.startsWith(DEALIOO_CHAT_MESSAGE_DB_PREFIX),
        )
        .map((name) => deleteIndexedDb(name)),
    );
  } catch {
    // best-effort
  }
}

export function clearRetentionLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) {
      continue;
    }
    if (
      RETENTION_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export async function clearAllRetentionIndexedDb(): Promise<void> {
  await Promise.all([
    deleteIndexedDb(DEALIOO_CHAT_IDB_NAME),
    deleteIndexedDb(RETENTION_CHAT_IDB_NAME),
    deleteAllDealiooChatMessageDatabases(),
    deleteIndexedDb(DEALIOO_FUNNEL_TEMPLATE_IDB_NAME),
    deleteIndexedDb(RETENTION_FUNNEL_TEMPLATE_IDB_NAME),
  ]);
  clearRetentionLocalStorage();
}
