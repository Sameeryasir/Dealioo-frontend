"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SettingsSelectDropdown({
  value,
  options,
  onChange,
  ariaLabel = "Select option",
  locked = false,
  onLockedEdit,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  locked?: boolean;
  onLockedEdit?: () => void;
}) {
  const selected = options.find((o) => o.value === value);

  const triggerClassName =
    "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/80 bg-white py-2 pl-3.5 pr-2.5 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-950/[0.03] outline-none transition-all duration-200 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/10 active:scale-[0.99] data-popup-open:border-zinc-300 data-popup-open:shadow-[0_4px_16px_rgba(0,0,0,0.06)] data-popup-open:ring-zinc-900/10";
  if (locked) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => onLockedEdit?.()}
          aria-label={ariaLabel}
          className={triggerClassName}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selected?.label || "\u00A0"}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-zinc-500"
            aria-hidden
            strokeWidth={2}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={ariaLabel} className={triggerClassName}>
          <span className="min-w-0 flex-1 truncate text-left">
            {selected?.label || "\u00A0"}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-zinc-500"
            aria-hidden
            strokeWidth={2}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="max-h-56 rounded-xl border border-zinc-200/80 bg-white p-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-zinc-950/[0.05]"
        >
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`cursor-pointer gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  isSelected
                    ? "bg-zinc-50 font-semibold text-zinc-900 focus:bg-zinc-50 focus:text-zinc-900"
                    : "font-medium text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900"
                }`}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isSelected ? (
                    <Check
                      className="size-4 text-zinc-700"
                      strokeWidth={2.5}
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
