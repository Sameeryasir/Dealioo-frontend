"use client";

import { useEffect, useMemo, useState } from "react";
import { useBusinessChatCustomersQuery } from "@/app/hooks/use-business-chat-customers-query";
import { warmRestaurantConversationMessageCache, prefetchConversationMessageCache } from "@/app/services/chat/chat-indexed-db";
import { GuestChatConversationPanel } from "./guest-chats/GuestChatConversationPanel";
import { GuestChatSelectConversationEmptyState } from "./guest-chats/GuestChatEmptyStates";
import { GuestChatSidebar } from "./guest-chats/GuestChatSidebar";
import { matchesSearch } from "./guest-chats/guest-chats-utils";

export function BusinessChatsPanel({ businessId }: { businessId: number }) {
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [mobileShowList, setMobileShowList] = useState(true);

  const {
    rows,
    totalPages,
    total,
    loading,
    error,
    page,
    setPage,
  } = useBusinessChatCustomersQuery(businessId);

  useEffect(() => {
    if (businessId < 1) {
      return;
    }

    void warmRestaurantConversationMessageCache(businessId);
  }, [businessId]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );

  const selectedRow = useMemo(() => {
    if (selectedCustomerId == null) return null;
    return (
      filteredRows.find((row) => row.customerId === selectedCustomerId) ?? null
    );
  }, [filteredRows, selectedCustomerId]);

  function handleSelectGuest(customerId: number) {
    prefetchConversationMessageCache(businessId, customerId);
    setSelectedCustomerId(customerId);
    setMobileShowList(false);
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 w-full flex-col overflow-hidden bg-[#e8f2ff]/35">
      <div className="flex h-full min-h-0 w-full overflow-hidden rounded-none border border-[#e8edf5] bg-white shadow-sm lg:rounded-2xl lg:shadow-[0_8px_30px_rgba(24,119,242,0.08)]">
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
            error={error}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
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
