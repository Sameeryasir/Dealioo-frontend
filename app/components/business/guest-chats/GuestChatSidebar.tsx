"use client";

import { LayoutGroup, motion } from "framer-motion";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { RESTAURANT_CHAT_PAGE_SIZE, type ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { GuestChatCard } from "./GuestChatCard";
import {
  GuestChatErrorEmptyState,
  GuestChatNoSearchResultsEmptyState,
  GuestChatNoThreadsEmptyState,
} from "./GuestChatEmptyStates";
import { guestChatEase } from "./guest-chats-motion";
import { GuestChatScrollArea } from "./GuestChatScrollArea";
import { GuestChatSearchBar } from "./GuestChatSearchBar";
import { GuestChatSidebarSkeleton } from "./GuestChatSkeletons";

const guestChatListLayoutTransition = {
  layout: { duration: 0.22, ease: guestChatEase },
};

export function GuestChatSidebar({
  rows,
  filteredRows,
  selectedCustomerId,
  search,
  onSearchChange,
  onSelect,
  businessId,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
}: {
  rows: ChatCustomer[];
  filteredRows: ChatCustomer[];
  selectedCustomerId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (customerId: number) => void;
  businessId: number;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-[#e8edf5] bg-white lg:w-[380px] lg:shrink-0">
      <div className="relative shrink-0 overflow-hidden border-b border-[#e8edf5] bg-gradient-to-br from-[#e8f2ff] via-white to-white px-5 pb-4 pt-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(24,119,242,0.14)_0%,transparent_70%)]"
        />
        <div className="relative mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#07111f]">Guest Chats</h1>
        </div>
        <GuestChatSearchBar value={search} onChange={onSearchChange} />
      </div>

      <GuestChatScrollArea className="min-h-0 flex-1">
        {loading && rows.length === 0 ? (
          <GuestChatSidebarSkeleton />
        ) : error ? (
          <GuestChatErrorEmptyState title="Could not load guests" description={error} />
        ) : filteredRows.length === 0 ? (
          rows.length === 0 ? (
            <GuestChatNoThreadsEmptyState />
          ) : (
            <GuestChatNoSearchResultsEmptyState />
          )
        ) : (
          <LayoutGroup id="guest-chat-sidebar">
            <div className="space-y-2 p-4">
              {filteredRows.map((row) => (
                <motion.div
                  key={row.customerId}
                  layout="position"
                  transition={guestChatListLayoutTransition}
                >
                  <GuestChatCard
                    row={row}
                    businessId={businessId}
                    selected={selectedCustomerId === row.customerId}
                    onSelect={() => onSelect(row.customerId)}
                  />
                </motion.div>
              ))}
            </div>
          </LayoutGroup>
        )}
      </GuestChatScrollArea>

      {!(loading && rows.length === 0) && !error && totalPages > 1 ? (
        <div className="shrink-0 border-t border-[#e8edf5] px-5 py-4">
          <OffsetPagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={RESTAURANT_CHAT_PAGE_SIZE}
            loading={loading}
            onPageChange={onPageChange}
            itemLabel="guests"
          />
        </div>
      ) : null}
    </aside>
  );
}
