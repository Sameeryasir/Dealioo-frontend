"use client";

import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

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
}) {
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({ width: "anchor", align: "left", estimatedHeight: 280 });

  const selected = options.find((option) => option.value === value);
  const hasValue = Boolean(value.trim());

  const menu =
    open && menuPosition && mounted
      ? createPortal(
          <div ref={menuRef}>
            <ul
              role="listbox"
              aria-label={ariaLabel}
              style={{ ...menuStyle, zIndex: menuZIndex }}
              className="max-h-64 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.04]"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "bg-[#f4f8ff] font-semibold text-[#1877f2]"
                          : "font-medium text-[#0f172a] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <Check
                          className="size-4 shrink-0 text-[#1877f2]"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative min-w-0 flex-1">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            hasValue ? "" : placeholderClassName
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#94a3b8] transition ${open ? "rotate-180" : ""}`}
          strokeWidth={2.25}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
