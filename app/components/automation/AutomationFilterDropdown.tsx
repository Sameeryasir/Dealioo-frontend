"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Filter } from "lucide-react";
import { createPortal } from "react-dom";
import { automationEase } from "@/app/components/automation/automation-ui";
import type { AutomationFilter } from "@/app/components/automation/types";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";

type FilterOption = { id: AutomationFilter; label: string };

export function AutomationFilterDropdown({
  value,
  options,
  onChange,
  className = "",
}: {
  value: AutomationFilter;
  options: FilterOption[];
  onChange: (value: AutomationFilter) => void;
  className?: string;
}) {
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({ width: "anchor", align: "left" });

  const selected = options.find((o) => o.id === value) ?? options[0];

  const menu =
    open && menuPosition ? (
      <div ref={menuRef}>
      <motion.ul
        role="listbox"
        aria-label="Status filter"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: automationEase }}
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg ring-1 ring-zinc-950/[0.04]"
      >
        {options.map((option, index) => {
          const isSelected = value === option.id;
          return (
            <motion.li
              key={option.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.24,
                delay: index * 0.05,
                ease: automationEase,
              }}
            >
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "bg-violet-50 font-semibold text-violet-900"
                    : "font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isSelected ? (
                    <Check className="size-4 text-violet-600" strokeWidth={2.5} />
                  ) : null}
                </span>
                {option.label}
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Filter automations by status"
        className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-zinc-200/90 bg-white py-2.5 pl-3 pr-3 text-sm font-medium text-zinc-800 shadow-sm outline-none transition hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-violet-500/25"
      >
        <Filter className="size-4 shrink-0 text-violet-600" aria-hidden strokeWidth={2.5} />
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.32, ease: automationEase }}
          className="shrink-0 text-zinc-500"
        >
          <ChevronDown className="size-4" aria-hidden strokeWidth={2.5} />
        </motion.span>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>{menu}</AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
