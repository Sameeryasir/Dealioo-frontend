export const RETENTION_CHAT_IDB_NAME = "retention-chat";
export const RETENTION_FUNNEL_TEMPLATE_IDB_NAME = "retention-funnel-templates";

export const RETENTION_LOCAL_STORAGE_PREFIXES = [
  "retention:funnel-template:",
  "retention-chat",
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
    deleteIndexedDb(RETENTION_CHAT_IDB_NAME),
    deleteIndexedDb(RETENTION_FUNNEL_TEMPLATE_IDB_NAME),
  ]);
  clearRetentionLocalStorage();
}
