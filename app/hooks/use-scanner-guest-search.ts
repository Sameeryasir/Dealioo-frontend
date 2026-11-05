"use client";

import {
  GUEST_SEARCH_PAGE_SIZE,
  searchCustomers,
  type CustomerSearchResult,
} from "@/app/services/customer/search-customers";
import { useCallback, useEffect, useRef, useState } from "react";

export function useScannerGuestSearch(businessId: number) {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const requestSeqRef = useRef(0);

  const runSearch = useCallback(
    async (searchQuery: string, searchPage: number) => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) return;

      const requestId = ++requestSeqRef.current;
      setSearching(true);
      setErrorMessage(null);
      setActiveQuery(trimmed);
      setPage(searchPage);

      try {
        const response = await searchCustomers(
          businessId,
          trimmed,
          searchPage,
          GUEST_SEARCH_PAGE_SIZE,
        );
        if (requestId !== requestSeqRef.current) return;

        setResults(response.data);
        setMeta(response.meta);
        setPage(response.meta.page);
      } catch (err) {
        if (requestId !== requestSeqRef.current) return;
        setResults([]);
        setMeta(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Search failed. Try again.",
        );
      } finally {
        if (requestId === requestSeqRef.current) {
          setSearching(false);
        }
      }
    },
    [businessId],
  );

  const handleSearch = useCallback(() => {
    void runSearch(query, 1);
  }, [query, runSearch]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!activeQuery) return;
      void runSearch(activeQuery, nextPage);
    },
    [activeQuery, runSearch],
  );

  useEffect(() => {
    return () => {
      requestSeqRef.current += 1;
    };
  }, [businessId]);

  const clearResults = useCallback(() => {
    requestSeqRef.current += 1;
    setResults([]);
    setMeta(null);
    setActiveQuery("");
    setQuery("");
    setErrorMessage(null);
    setPage(1);
    setSearching(false);
  }, []);

  return {
    query,
    setQuery,
    activeQuery,
    page,
    searching,
    errorMessage,
    setErrorMessage,
    results,
    setResults,
    meta,
    setMeta,
    handleSearch,
    handlePageChange,
    runSearch,
    clearResults,
  };
}
