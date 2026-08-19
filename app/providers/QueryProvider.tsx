"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { clearAllRetentionIndexedDb } from "@/app/lib/clear-retention-indexed-db";

const INDEXED_DB_WIPE_KEY = "dealioo-idb-clear-conversations-20260820";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (window.localStorage.getItem(INDEXED_DB_WIPE_KEY) === "1") {
      return;
    }
    void clearAllRetentionIndexedDb().finally(() => {
      window.localStorage.setItem(INDEXED_DB_WIPE_KEY, "1");
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
