"use client";

import { useCallback, useEffect, useState } from "react";
import { INITIAL_TEMPLATE_PAGES } from "@/app/components/crm-template-editor/template-data";
import type { TemplatePagesState } from "@/app/components/crm-template-editor/template-types";

const STORAGE_PREFIX = "retention:funnel-template:v1:";
const SAVED_EVENT = "retention:funnel-template-saved";
const BROADCAST_NAME = "retention-funnel-template-sync";

const IDB_NAME = "retention-funnel-templates";
const IDB_STORE = "pages";
const IDB_VERSION = 1;

export function funnelTemplateStorageKey(campaignId: string): string {
  return `${STORAGE_PREFIX}${campaignId}`;
}

function isTemplatePagesState(x: unknown): x is TemplatePagesState {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const ids = ["landing", "signup", "payment", "confirmation"] as const;
  return ids.every((id) => {
    const p = o[id];
    return (
      p !== null &&
      typeof p === "object" &&
      (p as { id?: string }).id === id
    );
  });
}

function loadFromLocalStorage(campaignId: string): TemplatePagesState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(funnelTemplateStorageKey(campaignId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isTemplatePagesState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("indexedDB.open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

async function idbGet(campaignId: string): Promise<TemplatePagesState | null> {
  try {
    const db = await openIdb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const r = tx.objectStore(IDB_STORE).get(campaignId);
      r.onsuccess = () => {
        const v = r.result as unknown;
        resolve(v && isTemplatePagesState(v) ? v : null);
      };
      r.onerror = () => reject(r.error);
    });
  } catch {
    return null;
  }
}

async function idbPut(
  campaignId: string,
  pages: TemplatePagesState,
): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(pages, campaignId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("indexedDB write failed"));
    tx.onabort = () => reject(tx.error ?? new Error("indexedDB abort"));
  });
}

function dispatchSaved(campaignId: string) {
  window.dispatchEvent(
    new CustomEvent<{ campaignId: string }>(SAVED_EVENT, {
      detail: { campaignId },
    }),
  );
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(BROADCAST_NAME);
      bc.postMessage({ campaignId });
      bc.close();
    }
  } catch {}
}

export async function loadFunnelTemplatePagesAsync(
  campaignId: string,
): Promise<TemplatePagesState | null> {
  if (typeof window === "undefined") return null;
  const fromIdb = await idbGet(campaignId);
  if (fromIdb) return fromIdb;
  return loadFromLocalStorage(campaignId);
}

export async function saveFunnelTemplatePagesAsync(
  campaignId: string,
  pages: TemplatePagesState,
): Promise<void> {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(pages);
  let ok = false;
  try {
    await idbPut(campaignId, pages);
    ok = true;
    try {
      localStorage.removeItem(funnelTemplateStorageKey(campaignId));
    } catch {}
  } catch {
    try {
      localStorage.setItem(funnelTemplateStorageKey(campaignId), json);
      ok = true;
    } catch {}
  }
  if (ok) dispatchSaved(campaignId);
}

export async function mirrorFunnelTemplatePagesToFunnelId(
  campaignId: string,
  funnelId: number | null | undefined,
  pages: TemplatePagesState,
): Promise<void> {
  const funnelKey = funnelId != null && funnelId >= 1 ? String(funnelId) : null;
  if (!funnelKey || funnelKey === campaignId) return;
  await saveFunnelTemplatePagesAsync(funnelKey, pages);
}

function readInitialTemplatePages(campaignId: string): TemplatePagesState {
  if (!campaignId) return INITIAL_TEMPLATE_PAGES;
  return loadFromLocalStorage(campaignId) ?? INITIAL_TEMPLATE_PAGES;
}

export function useFunnelTemplatePagesFromStorage(campaignId: string) {
  const [pages, setPages] = useState<TemplatePagesState>(() =>
    readInitialTemplatePages(campaignId),
  );
  const [isLoading, setIsLoading] = useState(
    () => Boolean(campaignId) && loadFromLocalStorage(campaignId) == null,
  );

  const reload = useCallback(async (withLoading = false) => {
    if (!campaignId) {
      setPages(INITIAL_TEMPLATE_PAGES);
      setIsLoading(false);
      return;
    }
    if (withLoading) {
      setIsLoading(true);
    }
    try {
      const loaded = await loadFunnelTemplatePagesAsync(campaignId);
      if (loaded) setPages(loaded);
      else setPages(INITIAL_TEMPLATE_PAGES);
    } finally {
      if (withLoading) {
        setIsLoading(false);
      }
    }
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) {
      setPages(INITIAL_TEMPLATE_PAGES);
      setIsLoading(false);
      return;
    }
    void reload(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === funnelTemplateStorageKey(campaignId)) void reload();
    };
    const onSaved = (e: Event) => {
      const ce = e as CustomEvent<{ campaignId?: string }>;
      if (ce.detail?.campaignId === campaignId) void reload();
    };
    const bc =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(BROADCAST_NAME)
        : null;
    const onBroadcast = (ev: MessageEvent<{ campaignId?: string }>) => {
      if (ev.data?.campaignId === campaignId) void reload();
    };
    bc?.addEventListener("message", onBroadcast);
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_EVENT, onSaved as EventListener);
    return () => {
      bc?.removeEventListener("message", onBroadcast);
      bc?.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_EVENT, onSaved as EventListener);
    };
  }, [campaignId, reload]);

  return { pages, isLoading };
}
