"use client";

import { Check, ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AutomationFilterDropdown<T extends string>({
  value,
  options,
  onChange,
  className = "",
  ariaLabel = "Filter by status",
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const selected = options.find((o) => o.id === value) ?? options[0];

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={ariaLabel}
          className="flex h-10 w-full min-w-[8.5rem] cursor-pointer items-center gap-2 rounded-xl border border-[#e8edf5] bg-white py-2 pl-3 pr-2.5 text-sm font-semibold text-[#07111f] shadow-sm outline-none transition hover:border-[#1877f2]/30 hover:bg-[#f8faff] focus-visible:border-[#1877f2]/40 focus-visible:ring-2 focus-visible:ring-[#1877f2]/15 data-popup-open:border-[#1877f2]/40"
        >
          <Filter
            className="size-4 shrink-0 text-[#1877f2]"
            aria-hidden
            strokeWidth={2.5}
          />
          <span className="min-w-0 flex-1 truncate text-left">
            {selected?.label}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-zinc-500"
            aria-hidden
            strokeWidth={2.5}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="rounded-xl border border-zinc-200/90 bg-white p-1 shadow-lg ring-1 ring-zinc-950/[0.04]"
        >
          {options.map((option) => {
            const isSelected = value === option.id;
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onChange(option.id)}
                className={`cursor-pointer gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  isSelected
                    ? "bg-[#e8f2ff] font-semibold text-[#0f5ed7] focus:bg-[#e8f2ff] focus:text-[#0f5ed7]"
                    : "font-medium text-[#334155] focus:bg-[#f8faff] focus:text-[#07111f]"
                }`}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isSelected ? (
                    <Check
                      className="size-4 text-[#1877f2]"
                      strokeWidth={2.5}
                    />
                  ) : null}
                </span>
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
