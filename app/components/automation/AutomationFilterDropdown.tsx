"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Filter } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { automationEase } from "@/app/components/automation/automation-ui";
import type { AutomationFilter } from "@/app/components/automation/types";

type FilterOption = { id: AutomationFilter; label: string };

type MenuPosition = { top: number; left: number; width: number };

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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  const updateMenuPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = anchorRef.current;
      if (el && !el.contains(e.target as Node)) {
        const menu = document.getElementById("automation-filter-menu");
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => updateMenuPosition();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  const menu =
    mounted && open && menuPosition ? (
      <motion.ul
        id="automation-filter-menu"
        role="listbox"
        aria-label="Status filter"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.32, ease: automationEase }}
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          zIndex: 100,
        }}
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
            <AnimatePresence>{open && menuPosition ? menu : null}</AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
