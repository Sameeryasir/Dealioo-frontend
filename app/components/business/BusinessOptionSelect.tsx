"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BusinessOption = {
  value: string;
  label: string;
};

export function BusinessOptionSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select…",
  ariaLabel,
  triggerClassName = "",
  placeholderClassName = "font-medium text-[#94a3b8]",
  menuZIndex = 120,
  disabled,
  hideChevron = false,
}: {
  id?: string;
  value: string;
  options: BusinessOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  triggerClassName?: string;
  placeholderClassName?: string;
  menuZIndex?: number;
  disabled?: boolean;
  hideChevron?: boolean;
}) {
  const selected = options.find((option) => option.value === value);
  const hasValue = Boolean(value.trim());

  return (
    <div className="relative min-w-0 flex-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          className={`flex w-full cursor-pointer items-center justify-between gap-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              hasValue ? "" : placeholderClassName
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
          {hideChevron ? null : (
            <ChevronDown
              className="size-4 shrink-0 text-[#94a3b8]"
              strokeWidth={2.25}
              aria-hidden
            />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          style={{ zIndex: menuZIndex }}
          className="max-h-64 rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`cursor-pointer justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm ${
                  isSelected
                    ? "bg-[#f4f8ff] font-semibold text-[#1877f2] focus:bg-[#f4f8ff] focus:text-[#1877f2]"
                    : "font-medium text-[#0f172a] focus:bg-[#f8fafc]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected ? (
                  <Check
                    className="size-4 shrink-0 text-[#1877f2]"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
