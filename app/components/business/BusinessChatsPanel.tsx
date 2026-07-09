"use client";

import { useEffect, useMemo, useState } from "react";
import { useBusinessChatCustomersQuery } from "@/app/hooks/use-business-chat-customers-query";
import { warmRestaurantConversationMessageCache, prefetchConversationMessageCache } from "@/app/services/chat/chat-indexed-db";
import { GuestChatConversationPanel } from "./guest-chats/GuestChatConversationPanel";
import { GuestChatSelectConversationEmptyState } from "./guest-chats/GuestChatEmptyStates";
import { GuestChatSidebar } from "./guest-chats/GuestChatSidebar";
import { matchesSearch } from "./guest-chats/guest-chats-utils";

export function BusinessChatsPanel({ restaurantId }: { restaurantId: number }) {
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
  } = useBusinessChatCustomersQuery(restaurantId);

  useEffect(() => {
    if (restaurantId < 1) {
      return;
    }

    void warmRestaurantConversationMessageCache(restaurantId);
  }, [restaurantId, rows]);

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
    prefetchConversationMessageCache(restaurantId, customerId);
    setSelectedCustomerId(customerId);
    setMobileShowList(false);
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 w-full flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">
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
            restaurantId={restaurantId}
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
              restaurantId={restaurantId}
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
