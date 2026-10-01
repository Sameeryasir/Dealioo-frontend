"use client";

import { Check, ChevronDown, Tags } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActivityEventType } from "@/app/services/activity/get-business-activity";

export type ActivityEventFilter = "all" | ActivityEventType | "in_person";

const EVENT_TYPE_OPTIONS: { id: ActivityEventFilter; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "signed_up", label: "Signed up" },
  { id: "redeemed_reward", label: "Redeemed" },
  { id: "prepaid_for_offer", label: "Paid online" },
  { id: "in_person", label: "In person" },
  { id: "message_sent", label: "Text sent" },
];

export function ActivityEventTypeDropdown({
  value,
  onChange,
  className = "",
}: {
  value: ActivityEventFilter;
  onChange: (value: ActivityEventFilter) => void;
  className?: string;
}) {
  const selected =
    EVENT_TYPE_OPTIONS.find((option) => option.id === value) ??
    EVENT_TYPE_OPTIONS[0];

  return (
    <div className={className}>
      <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-zinc-600 sm:w-auto sm:shrink-0">
        Event types
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Filter by event type"
            className="flex h-[42px] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 transition hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 sm:min-w-[12rem]"
          >
            <Tags className="size-4 shrink-0 text-zinc-500" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
            <ChevronDown className="size-4 shrink-0 text-zinc-400" aria-hidden />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="rounded-xl border border-zinc-200/90 bg-white p-1 shadow-lg ring-1 ring-zinc-950/[0.04]"
          >
            {EVENT_TYPE_OPTIONS.map((option) => {
              const isSelected = value === option.id;
              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => onChange(option.id)}
                  className={`cursor-pointer gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    isSelected
                      ? "bg-zinc-100 font-semibold text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900"
                      : "font-medium text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
                  }`}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {isSelected ? (
                      <Check
                        className="size-4 text-zinc-700"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </label>
    </div>
  );
}
