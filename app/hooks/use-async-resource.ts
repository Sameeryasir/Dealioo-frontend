"use client";

import { useEffect, useState } from "react";
import { API_MIN_LOADING_MS, delay } from "@/app/lib/api";

export function useAsyncResource<T>(
  enabled: boolean,
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  options?: {
    minLoadingMs?: boolean;
    fallbackError?: string;
    initialLoading?: boolean;
    resetWhenDisabled?: T;
  },
) {
  const fallbackError = options?.fallbackError ?? "Could not load data.";
  const initialLoading = options?.initialLoading ?? enabled;
  const resetWhenDisabled = options?.resetWhenDisabled;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setData(resetWhenDisabled ?? null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const run = async () => {
      try {
        const result = options?.minLoadingMs
          ? (await Promise.all([fetcher(), delay(API_MIN_LOADING_MS)]))[0]
          : await fetcher();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setData(resetWhenDisabled ?? null);
          setError(e instanceof Error ? e.message : fallbackError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, [enabled, fetcher, fallbackError, ...deps]);

  return { data, isLoading, error, setData };
}
