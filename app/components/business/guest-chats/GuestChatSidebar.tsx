"use client";

/**
 * Change summary:
 * - What: Removed bottom page buttons; scrolling near the end loads the next guests page.
 * - Why: Owner expects infinite scroll so older guests (e.g. Sameer) appear after the first 20.
 * - Related: useBusinessChatCustomersQuery.loadMore
 */

import { useCallback, useEffect, useRef, type UIEvent } from "react";
import { LayoutGroup, motion } from "framer-motion";
import type { ChatCustomer } from "@/app/services/chat/get-business-chat-customers";
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

// How close to the bottom (px) before we request the next page.
const LOAD_MORE_THRESHOLD_PX = 160;

export function GuestChatSidebar({
  rows,
  filteredRows,
  selectedCustomerId,
  search,
  onSearchChange,
  onSelect,
  businessId,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
}: {
  rows: ChatCustomer[];
  filteredRows: ChatCustomer[];
  selectedCustomerId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (customerId: number) => void;
  businessId: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // If the first page does not fill the sidebar, keep loading until it does (or no more pages).
  useEffect(() => {
    if (!hasMore || loading || loadingMore || rows.length === 0) {
      return;
    }

    const el = scrollRef.current;
    if (!el) {
      return;
    }

    if (el.scrollHeight <= el.clientHeight + LOAD_MORE_THRESHOLD_PX) {
      onLoadMore();
    }
  }, [hasMore, loading, loadingMore, rows.length, onLoadMore]);

  // --- Infinite scroll: when near bottom, ask hook for the next page ---
  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingMore) {
        return;
      }

      const target = event.currentTarget;
      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (distanceFromBottom > LOAD_MORE_THRESHOLD_PX) {
        return;
      }

      onLoadMore();
    },
    [hasMore, loadingMore, onLoadMore],
  );

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

      <GuestChatScrollArea
        ref={scrollRef}
        className="min-h-0 flex-1"
        onScroll={handleScroll}
      >
        {loading && rows.length === 0 ? (
          <GuestChatSidebarSkeleton />
        ) : error && rows.length === 0 ? (
          <GuestChatErrorEmptyState title="Could not load guests" description={error} />
        ) : filteredRows.length === 0 ? (
          rows.length === 0 ? (
            <GuestChatNoThreadsEmptyState />
          ) : hasMore || loadingMore ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              Searching loaded guests…
            </p>
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

              {loadingMore ? (
                <p className="py-3 text-center text-xs text-zinc-500">
                  Loading more guests…
                </p>
              ) : null}

              {!hasMore && rows.length > 0 ? (
                <p className="py-3 text-center text-xs text-zinc-400">
                  All guests loaded
                </p>
              ) : null}
            </div>
          </LayoutGroup>
        )}
      </GuestChatScrollArea>
    </aside>
  );
}
