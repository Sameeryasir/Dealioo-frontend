"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";

type PageCacheEntry<T, M> = { data: T[]; meta: M };

export function usePaginatedAsyncResource<T, M extends { page: number }>(
  enabled: boolean,
  fetchPage: (page: number) => Promise<{ data: T[]; meta: M }>,
  deps: readonly unknown[],
  options?: {
    fallbackError?: string;
    resetWhenDisabled?: { data: T[]; meta: M | null };
  },
) {
  const fallbackError = options?.fallbackError ?? "Could not load data.";
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const resetWhenDisabledRef = useRef(options?.resetWhenDisabled);
  resetWhenDisabledRef.current = options?.resetWhenDisabled;

  const emptyListRef = useRef<T[]>([]);
  const pageCacheRef = useRef(new Map<number, PageCacheEntry<T, M>>());

  const [data, setData] = useState<T[]>(
    () => options?.resetWhenDisabled?.data ?? emptyListRef.current,
  );
  const [meta, setMeta] = useState<M | null>(
    () => options?.resetWhenDisabled?.meta ?? null,
  );
  const [page, setPageState] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;

  const clearPageCache = useCallback(() => {
    pageCacheRef.current.clear();
  }, []);

  const beginFetch = useCallback(() => {
    const hasCachedRows = dataRef.current.length > 0;
    setLoading(!hasCachedRows);
    setRefreshing(hasCachedRows);
  }, []);

  const endFetch = useCallback(() => {
    setLoading(false);
    setRefreshing(false);
  }, []);

  const applyDisabledReset = useCallback(() => {
    const reset = resetWhenDisabledRef.current;
    const nextData = reset?.data ?? emptyListRef.current;
    clearPageCache();
    setData((prev) => (prev === nextData ? prev : nextData));
    setMeta((prev) => {
      const nextMeta = reset?.meta ?? null;
      return prev === nextMeta ? prev : nextMeta;
    });
    setLoading(false);
    setRefreshing(false);
  }, [clearPageCache]);

  const applyPageResult = useCallback((nextData: T[], nextMeta: M) => {
    pageCacheRef.current.set(nextMeta.page, { data: nextData, meta: nextMeta });
    setData(nextData);
    setMeta(nextMeta);
    setPageState(nextMeta.page);
  }, []);

  const loadPage = useCallback(
    async (targetPage: number, options?: { force?: boolean }) => {
      if (!enabled) {
        applyDisabledReset();
        return;
      }

      const cached = pageCacheRef.current.get(targetPage);
      if (cached && !options?.force) {
        setError(null);
        setData(cached.data);
        setMeta(cached.meta);
        setPageState(cached.meta.page);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      beginFetch();

      try {
        const response = await fetchPageRef.current(targetPage);
        if (!mountedRef.current) return;
        applyPageResult(response.data, response.meta);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(getApiErrorMessage(e, fallbackError));
        const reset = resetWhenDisabledRef.current;
        const nextData = reset?.data ?? emptyListRef.current;
        setData((prev) => (prev === nextData ? prev : nextData));
        setMeta((prev) => {
          const nextMeta = reset?.meta ?? null;
          return prev === nextMeta ? prev : nextMeta;
        });
      } finally {
        if (mountedRef.current) {
          endFetch();
        }
      }
    },
    [
      enabled,
      fallbackError,
      applyDisabledReset,
      applyPageResult,
      beginFetch,
      endFetch,
    ],
  );

  const refetch = useCallback(async () => {
    await loadPage(page, { force: true });
  }, [loadPage, page]);

  const setPage = useCallback(
    (nextPage: number) => {
      void loadPage(nextPage);
    },
    [loadPage],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      applyDisabledReset();
      return () => {
        mountedRef.current = false;
      };
    }

    let cancelled = false;
    clearPageCache();

    const run = async () => {
      setError(null);
      beginFetch();
      try {
        const response = await fetchPageRef.current(1);
        if (cancelled || !mountedRef.current) return;
        applyPageResult(response.data, response.meta);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        setError(getApiErrorMessage(e, fallbackError));
        const reset = resetWhenDisabledRef.current;
        const nextData = reset?.data ?? emptyListRef.current;
        setData((prev) => (prev === nextData ? prev : nextData));
        setMeta((prev) => {
          const nextMeta = reset?.meta ?? null;
          return prev === nextMeta ? prev : nextMeta;
        });
      } finally {
        if (!cancelled && mountedRef.current) {
          endFetch();
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps; fetchPage via ref
  }, [enabled, fallbackError, applyDisabledReset, applyPageResult, beginFetch, endFetch, clearPageCache, ...deps]);

  const patchData = useCallback((updater: (prev: T[]) => T[]) => {
    setData((prev) => {
      const next = updater(prev);
      const currentPage = pageCacheRef.current;
      for (const [pageKey, entry] of currentPage) {
        if (entry.data === prev) {
          currentPage.set(pageKey, { ...entry, data: next });
        }
      }
      return next;
    });
  }, []);

  const patchMeta = useCallback((updater: (prev: M | null) => M | null) => {
    setMeta((prev) => {
      const next = updater(prev);
      if (next != null) {
        const cached = pageCacheRef.current.get(next.page);
        if (cached) {
          pageCacheRef.current.set(next.page, { ...cached, meta: next });
        }
      }
      return next;
    });
  }, []);

  return {
    data,
    meta,
    page,
    setPage,
    loading,
    refreshing,
    error,
    refetch,
    loadPage,
    patchData,
    patchMeta,
  };
}
