"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { automationEase } from "@/app/lib/motion";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";

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
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({ width: "anchor", align: "left", estimatedHeight: 200 });

  const selected =
    options.find((o) => o.value === value) ?? options[0];

  const menu =
    open && menuPosition ? (
      <div ref={menuRef}>
        <motion.ul
          role="listbox"
          aria-label={ariaLabel}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
          style={menuStyle}
          className="max-h-56 overflow-y-auto overflow-hidden rounded-xl border border-zinc-200/80 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-zinc-950/[0.05]"
        >
          {options.map((option, index) => {
            const isSelected = value === option.value;
            return (
              <motion.li
                key={option.value}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.18,
                  delay: index * 0.03,
                  ease: automationEase,
                }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-zinc-50 font-semibold text-zinc-900"
                      : "font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {isSelected ? (
                      <Check className="size-4 text-zinc-700" strokeWidth={2.5} />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className="w-full">
      <button
        type="button"
        onClick={() => {
          if (locked) {
            onLockedEdit?.();
            return;
          }
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border bg-white py-2 pl-3.5 pr-2.5 text-sm font-medium text-zinc-900 shadow-sm ring-1 outline-none transition-all duration-200 active:scale-[0.99] ${
          open
            ? "border-zinc-300 ring-zinc-900/10 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            : "border-zinc-200/80 ring-zinc-950/[0.03] hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        } focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/10`}
      >
        <span className="min-w-0 flex-1 truncate text-left">
          {selected?.label ?? "Select…"}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: automationEase }}
          className="shrink-0 text-zinc-500"
        >
          <ChevronDown className="size-4" aria-hidden strokeWidth={2} />
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
