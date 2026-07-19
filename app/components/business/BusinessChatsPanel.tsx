"use client";

import { useEffect, useMemo, useState } from "react";
import { useBusinessChatCustomersQuery } from "@/app/hooks/use-business-chat-customers-query";
import { CHAT_USE_INDEXED_DB } from "@/app/services/chat/chat-cache-mode";
import {
  clearConversationMessageDatabasesForBusiness,
  prefetchConversationMessageCache,
  pruneConversationMessageDatabases,
  warmRestaurantConversationMessageCache,
} from "@/app/services/chat/chat-indexed-db";
import { GuestChatConversationPanel } from "./guest-chats/GuestChatConversationPanel";
import { GuestChatSelectConversationEmptyState } from "./guest-chats/GuestChatEmptyStates";
import { GuestChatSidebar } from "./guest-chats/GuestChatSidebar";
import { matchesSearch } from "./guest-chats/guest-chats-utils";

// One-shot: wipe chat IndexedDB after fake-message cleanup so UI matches server.
const CHAT_IDB_BUSINESS_CLEAR_KEY = "dealioo-chat-biz-clear-v5";

export function BusinessChatsPanel({ businessId }: { businessId: number }) {
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [mobileShowList, setMobileShowList] = useState(true);
  const [idbReady, setIdbReady] = useState(!CHAT_USE_INDEXED_DB);

  const {
    rows,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  } = useBusinessChatCustomersQuery(businessId);

  const keepCustomerIdsKey = useMemo(
    () =>
      rows
        .map((row) => row.customerId)
        .sort((a, b) => a - b)
        .join(","),
    [rows],
  );

  // --- Clear stale per-conversation IndexedDBs once (fake guests 204–223, etc.) ---
  useEffect(() => {
    if (businessId < 1 || !CHAT_USE_INDEXED_DB) {
      setIdbReady(true);
      return;
    }

    const clearKey = `${CHAT_IDB_BUSINESS_CLEAR_KEY}:${businessId}`;
    let cancelled = false;

    async function resetBusinessChatIdb() {
      try {
        if (window.localStorage.getItem(clearKey) !== "1") {
          await clearConversationMessageDatabasesForBusiness(businessId);
          window.localStorage.setItem(clearKey, "1");
        }
        if (!cancelled) {
          await warmRestaurantConversationMessageCache(businessId);
        }
      } finally {
        if (!cancelled) {
          setIdbReady(true);
        }
      }
    }

    void resetBusinessChatIdb();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // After the full guest list is loaded, drop any message DBs for guests that no longer exist.
  useEffect(() => {
    if (!CHAT_USE_INDEXED_DB || !idbReady || loading || loadingMore || hasMore) {
      return;
    }

    const keepIds = keepCustomerIdsKey
      ? keepCustomerIdsKey.split(",").map((value) => Number(value))
      : [];

    if (keepIds.length === 0) {
      void clearConversationMessageDatabasesForBusiness(businessId);
      return;
    }

    void pruneConversationMessageDatabases(businessId, keepIds);
  }, [
    businessId,
    idbReady,
    loading,
    loadingMore,
    hasMore,
    keepCustomerIdsKey,
  ]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );

  // Search only filters loaded rows — keep paging until a match appears or list ends.
  useEffect(() => {
    if (!search.trim() || loading || loadingMore || !hasMore) {
      return;
    }
    if (filteredRows.length === 0 && rows.length > 0) {
      loadMore();
    }
  }, [
    search,
    filteredRows.length,
    rows.length,
    hasMore,
    loading,
    loadingMore,
    loadMore,
  ]);

  const selectedRow = useMemo(() => {
    if (selectedCustomerId == null) return null;
    return (
      rows.find((row) => row.customerId === selectedCustomerId) ?? null
    );
  }, [rows, selectedCustomerId]);

  function handleSelectGuest(customerId: number) {
    if (CHAT_USE_INDEXED_DB) {
      prefetchConversationMessageCache(businessId, customerId);
    }
    setSelectedCustomerId(customerId);
    setMobileShowList(false);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
      <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden border-0 bg-white">
        <div
          className={`h-full min-h-0 shrink-0 overflow-hidden ${
            mobileShowList
              ? "flex w-full lg:w-[380px]"
              : "hidden lg:flex lg:w-[380px]"
          }`}
        >
          <GuestChatSidebar
            rows={rows}
            filteredRows={filteredRows}
            selectedCustomerId={selectedCustomerId}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelectGuest}
            businessId={businessId}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            error={error}
            onLoadMore={loadMore}
          />
        </div>

        <section
          className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white ${
            !mobileShowList && selectedRow ? "w-full" : "hidden lg:flex"
          }`}
        >
          {selectedRow ? (
            <GuestChatConversationPanel
              businessId={businessId}
              row={selectedRow}
              onBack={() => setMobileShowList(true)}
            />
          ) : (
            <GuestChatSelectConversationEmptyState
              hasGuests={filteredRows.length > 0}
            />
          )}
        </section>
      </div>
    </div>
  );
}
