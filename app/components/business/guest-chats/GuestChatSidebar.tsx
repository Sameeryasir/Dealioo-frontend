"use client";

import { motion } from "framer-motion";
import { OffsetPagination } from "@/app/components/shared/OffsetPagination";
import { RESTAURANT_CHAT_PAGE_SIZE, type ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
import { GuestChatCard } from "./GuestChatCard";
import {
  GuestChatErrorEmptyState,
  GuestChatNoSearchResultsEmptyState,
  GuestChatNoThreadsEmptyState,
} from "./GuestChatEmptyStates";
import { guestChatStagger, guestChatCardReveal } from "./guest-chats-motion";
import { GuestChatScrollArea } from "./GuestChatScrollArea";
import { GuestChatSearchBar } from "./GuestChatSearchBar";
import { GuestChatSidebarSkeleton } from "./GuestChatSkeletons";

export function GuestChatSidebar({
  rows,
  filteredRows,
  selectedCustomerId,
  search,
  onSearchChange,
  onSelect,
  restaurantId,
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
  restaurantId: number;
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-zinc-200/80 bg-white lg:w-[380px] lg:shrink-0">
      <div className="shrink-0 border-b border-zinc-200/80 bg-white px-5 pb-4 pt-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Guest Chats</h1>
          <p className="mt-1 text-sm text-zinc-500">Messages sent by automations</p>
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
          <motion.div
            variants={guestChatStagger}
            initial="hidden"
            animate="show"
            className="space-y-2 p-4"
          >
            {filteredRows.map((row) => (
              <motion.div key={row.customerId} variants={guestChatCardReveal}>
                <GuestChatCard
                  row={row}
                  restaurantId={restaurantId}
                  selected={selectedCustomerId === row.customerId}
                  onSelect={() => onSelect(row.customerId)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </GuestChatScrollArea>

      {!(loading && rows.length === 0) && !error && totalPages > 1 ? (
        <div className="shrink-0 border-t border-zinc-200/80 px-5 py-4">
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
