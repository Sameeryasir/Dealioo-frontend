"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Tags } from "lucide-react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { automationEase } from "@/app/lib/motion";
import type { ActivityEventType } from "@/app/services/activity/get-restaurant-activity";

export type ActivityEventFilter = "all" | ActivityEventType;

const EVENT_TYPE_OPTIONS: { id: ActivityEventFilter; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "visited", label: "Visited" },
  { id: "redeemed_reward", label: "Redeemed reward" },
  { id: "prepaid_for_offer", label: "Prepaid for offer" },
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
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: "anchor",
    align: "right",
    estimatedHeight: 200,
  });

  const selected =
    EVENT_TYPE_OPTIONS.find((option) => option.id === value) ??
    EVENT_TYPE_OPTIONS[0];

  const menu =
    open && menuPosition ? (
      <div ref={menuRef}>
        <motion.ul
          role="listbox"
          aria-label="Event types"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: automationEase }}
          style={menuStyle}
          className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg ring-1 ring-zinc-950/[0.04]"
        >
          {EVENT_TYPE_OPTIONS.map((option, index) => {
            const isSelected = value === option.id;
            return (
              <motion.li
                key={option.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.04,
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
                      ? "bg-zinc-100 font-semibold text-zinc-900"
                      : "font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
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
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className={className}>
      <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-zinc-600 sm:w-auto sm:shrink-0">
        Event types
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Filter by event type"
          className="flex h-[42px] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 transition hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 sm:min-w-[12rem]"
        >
          <Tags className="size-4 shrink-0 text-zinc-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{selected.label}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.24, ease: automationEase }}
            className="shrink-0 text-zinc-400"
          >
            <ChevronDown className="size-4" aria-hidden />
          </motion.span>
        </button>
      </label>

      {mounted
        ? createPortal(
            <AnimatePresence>{menu}</AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
