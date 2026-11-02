"use client";

import { MessageCircle } from "lucide-react";

export type GuestChatListFilter = "all" | "unread";

type GuestChatFilterTabsProps = {
  value: GuestChatListFilter;
  onChange: (value: GuestChatListFilter) => void;
  allCount: number;
  unreadCount: number;
};

export function GuestChatFilterTabs({
  value,
  onChange,
  allCount,
  unreadCount,
}: GuestChatFilterTabsProps) {
  return (
    <div
      className="mt-3 flex items-center gap-1 rounded-2xl border border-[#dbe2ea] bg-[#eef2f7] p-1"
      role="tablist"
      aria-label="Conversation filters"
    >
      <FilterTab
        id="all"
        label="All"
        count={allCount}
        active={value === "all"}
        onClick={() => onChange("all")}
      />
      <FilterTab
        id="unread"
        label="Unread"
        count={unreadCount}
        active={value === "unread"}
        showDot={unreadCount > 0 && value !== "unread"}
        onClick={() => onChange("unread")}
      />
    </div>
  );
}

function FilterTab({
  id,
  label,
  count,
  active,
  showDot = false,
  onClick,
}: {
  id: string;
  label: string;
  count: number;
  active: boolean;
  showDot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      id={`guest-chat-filter-${id}`}
      onClick={onClick}
      className={`relative inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-white font-semibold text-[#07111f] shadow-[0_2px_8px_rgba(14,24,43,0.08)] ring-1 ring-[#cfd8e3]"
          : "bg-transparent font-medium text-slate-500 hover:bg-white/50 hover:text-slate-700"
      }`}
    >
      <MessageCircle
        className={`size-3.5 shrink-0 ${active ? "text-[#07111f]" : "text-slate-400"}`}
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      />
      <span className="relative">
        {label}
        {showDot ? (
          <span
            className="absolute -right-1.5 -top-0.5 size-1.5 rounded-full bg-slate-500"
            aria-hidden
          />
        ) : null}
      </span>
      <span
        className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.68rem] font-semibold tabular-nums ${
          active
            ? "bg-[#e8edf5] text-[#07111f]"
            : "bg-[#e2e8f0] text-slate-500"
        }`}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
