"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBusinessChatCustomersQuery } from "@/app/hooks/use-business-chat-customers-query";
import { useBusinessConversationsPusher } from "@/app/hooks/use-business-chat-pusher";
import { CHAT_USE_INDEXED_DB } from "@/app/services/chat/chat-cache-mode";
import {
  clearConversationMessageDatabasesForBusiness,
  prefetchConversationMessageCache,
  pruneConversationMessageDatabases,
  warmRestaurantConversationMessageCache,
} from "@/app/services/chat/chat-indexed-db";
import { markConversationRead } from "@/app/services/chat/mark-conversation-read";
import { GuestChatConversationPanel } from "./guest-chats/GuestChatConversationPanel";
import { GuestChatSelectConversationEmptyState } from "./guest-chats/GuestChatEmptyStates";
import { GuestChatSidebar } from "./guest-chats/GuestChatSidebar";

const CHAT_IDB_BUSINESS_CLEAR_KEY = "dealioo-chat-biz-clear-v8";

export function BusinessChatsPanel({ businessId }: { businessId: number }) {
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [mobileShowList, setMobileShowList] = useState(true);
  const [idbReady, setIdbReady] = useState(!CHAT_USE_INDEXED_DB);
  const [liveUnreadByCustomerId, setLiveUnreadByCustomerId] = useState<
    Record<number, number>
  >({});
  const selectedCustomerIdRef = useRef(selectedCustomerId);
  selectedCustomerIdRef.current = selectedCustomerId;

  const {
    rows,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
  } = useBusinessChatCustomersQuery(businessId, search);

  const rowsByCustomerId = useMemo(() => {
    const map = new Map<number, (typeof rows)[number]>();
    for (const row of rows) {
      map.set(row.customerId, row);
    }
    return map;
  }, [rows]);

  const unreadByCustomerId = useMemo(() => {
    const merged: Record<number, number> = {};
    for (const row of rows) {
      const live = liveUnreadByCustomerId[row.customerId];
      merged[row.customerId] =
        typeof live === "number" ? live : (row.unreadCount ?? 0);
    }
    for (const [customerId, live] of Object.entries(liveUnreadByCustomerId)) {
      const id = Number(customerId);
      if (!merged[id] && live > 0) {
        merged[id] = live;
      }
    }
    return merged;
  }, [rows, liveUnreadByCustomerId]);

  useBusinessConversationsPusher(businessId, (payload) => {
    if (payload.businessId !== businessId) return;
    if (payload.message.direction !== "inbound") return;
    const customerId = payload.customerId;
    if (customerId < 1) return;

    if (selectedCustomerIdRef.current === customerId) {
      const conversationId =
        payload.conversationId ||
        rowsByCustomerId.get(customerId)?.conversationId ||
        0;
      setLiveUnreadByCustomerId((prev) => {
        if (!prev[customerId]) return prev;
        const next = { ...prev };
        delete next[customerId];
        return next;
      });
      if (conversationId > 0) {
        void markConversationRead(businessId, conversationId).catch(() => {});
      }
      return;
    }

    setLiveUnreadByCustomerId((prev) => {
      const serverCount = rowsByCustomerId.get(customerId)?.unreadCount ?? 0;
      const current = prev[customerId] ?? serverCount;
      return { ...prev, [customerId]: current + 1 };
    });
  });

  const keepCustomerIdsKey = useMemo(
    () =>
      rows
        .map((row) => row.customerId)
        .sort((a, b) => a - b)
        .join(","),
    [rows],
  );

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

  const filteredRows = rows;

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
    const conversationId =
      rowsByCustomerId.get(customerId)?.conversationId ?? 0;
    setLiveUnreadByCustomerId((prev) => {
      const next = { ...prev, [customerId]: 0 };
      return next;
    });
    if (conversationId > 0) {
      void markConversationRead(businessId, conversationId).catch(() => {});
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
            unreadByCustomerId={unreadByCustomerId}
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
