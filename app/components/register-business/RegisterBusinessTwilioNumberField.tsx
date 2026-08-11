"use client";

import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import { automationEase } from "@/app/lib/motion";
import type { TwilioPhoneNumberOption } from "@/app/services/business/twilio-phone-numbers";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2, Phone } from "lucide-react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type RegisterBusinessTwilioNumberFieldProps = {
  numbers: TwilioPhoneNumberOption[];
  selectedSid: string;
  isLoading: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  compact?: boolean;
  brand?: boolean;
  allAssigned?: boolean;
  onSelect: (sid: string) => void;
};

export function RegisterBusinessTwilioNumberField({
  numbers,
  selectedSid,
  isLoading,
  disabled = false,
  hideLabel = false,
  compact = false,
  brand = false,
  allAssigned = false,
  onSelect,
}: RegisterBusinessTwilioNumberFieldProps) {
  const labelId = useId();
  const listboxId = useId();
  const {
    open: menuOpen,
    setOpen: setMenuOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: "anchor",
    align: "left",
    estimatedHeight: 240,
    placement: "flip",
  });

  useEffect(() => {
    if (disabled) setMenuOpen(false);
  }, [disabled, setMenuOpen]);

  const selected = numbers.find((n) => n.sid === selectedSid) ?? null;
  const triggerDisabled = disabled || isLoading || numbers.length === 0;

  const menu =
    menuOpen && menuPosition ? (
      <div ref={menuRef}>
        <motion.ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
          style={menuStyle}
          className="z-[90] max-h-60 overflow-auto rounded-xl border border-zinc-200/90 bg-white py-1.5 shadow-xl ring-1 ring-zinc-950/[0.06]"
        >
          {numbers.map((option, index) => {
            const isSelected = selectedSid === option.sid;
            return (
              <motion.li
                key={option.sid}
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
                    onSelect(option.sid);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-[#e8f2ff] text-[#0f5ed7]"
                      : "text-zinc-800 hover:bg-[#f8faff]"
                  }`}
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                    {isSelected ? (
                      <Check
                        className="size-4 text-[#1877f2]"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {option.phoneNumber}
                    </span>
                    {option.friendlyName ? (
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isSelected ? "text-[#1877f2]/80" : "text-zinc-500"
                        }`}
                      >
                        {option.friendlyName}
                      </span>
                    ) : null}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    ) : null;

  return (
    <div className="w-full">
      {hideLabel ? (
        <span id={labelId} className="sr-only">
          Twilio SMS number
        </span>
      ) : (
        <span
          id={labelId}
          className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-500"
        >
          Twilio SMS number<span className="text-rose-500"> *</span>
        </span>
      )}

      <div ref={anchorRef} className="relative">
        <button
          type="button"
          disabled={triggerDisabled}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={labelId}
          className={`flex w-full cursor-pointer items-center rounded-xl border border-[#e8edf5] bg-white text-left shadow-sm outline-none transition hover:border-[#1877f2]/35 hover:bg-[#f8faff] focus-visible:border-[#1877f2]/45 focus-visible:ring-4 focus-visible:ring-[#1877f2]/12 disabled:cursor-not-allowed disabled:opacity-60 ${
            compact
              ? "h-10 gap-2 px-2.5"
              : brand
                ? "h-[3.35rem] gap-3 px-3.5"
                : "h-14 gap-3 px-4"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center ${
              brand
                ? "size-9 rounded-full text-white shadow-[0_8px_18px_rgba(124,58,237,0.28)]"
                : compact
                  ? "size-7 rounded-lg bg-[#e8f2ff] text-[#1877f2]"
                  : "size-8 rounded-lg bg-[#e8f2ff] text-[#1877f2]"
            }`}
            style={
              brand
                ? {
                    background:
                      "linear-gradient(135deg, #1877f2 0%, #7c3aed 55%, #db2777 100%)",
                  }
                : undefined
            }
            aria-hidden
          >
            {isLoading ? (
              <Loader2
                className={
                  brand
                    ? "size-4 animate-spin text-white"
                    : compact
                      ? "size-3.5 animate-spin"
                      : "size-4 animate-spin"
                }
                strokeWidth={2.25}
              />
            ) : (
              <Phone
                className={
                  brand
                    ? "size-4 text-white"
                    : compact
                      ? "size-3.5"
                      : "size-4"
                }
                strokeWidth={2.4}
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {isLoading ? (
              <span className="block text-sm font-medium text-zinc-500">
                Loading numbers…
              </span>
            ) : selected ? (
              <>
                <span
                  className={`block truncate font-semibold text-zinc-900 ${
                    compact ? "text-[0.8rem]" : "text-sm"
                  }`}
                >
                  {selected.phoneNumber}
                </span>
                {!compact && selected.friendlyName ? (
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">
                    {selected.friendlyName}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="block text-sm font-medium text-zinc-500">
                {allAssigned
                  ? "All numbers are assigned"
                  : numbers.length === 0
                    ? "No numbers found"
                    : "Select a number"}
              </span>
            )}
          </span>
          <motion.span
            animate={{ rotate: menuOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: automationEase }}
            className={`shrink-0 ${menuOpen ? "text-[#1877f2]" : "text-zinc-400"}`}
          >
            <ChevronDown className="size-4" aria-hidden strokeWidth={2.5} />
          </motion.span>
        </button>
      </div>

      {mounted
        ? createPortal(<AnimatePresence>{menu}</AnimatePresence>, document.body)
        : null}
    </div>
  );
}
