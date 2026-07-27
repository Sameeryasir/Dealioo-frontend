"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2, Phone, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import {
  useAssociateBusinessTwilioPhoneNumberMutation,
  useBusinessTwilioPhoneNumbersQuery,
} from "@/app/hooks/use-business-twilio-phone-numbers-query";
import { automationEase } from "@/app/lib/motion";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import type { TwilioPhoneNumberOption } from "@/app/services/business/twilio-phone-numbers";

type ChooseNumberDialogProps = {
  open: boolean;
  businessId: number;
  isBusy?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  dismissible?: boolean;
  onClose: () => void;
  onConfirmed: () => void | Promise<void>;
};

function formatNumberLabel(n: TwilioPhoneNumberOption): string {
  return n.phoneNumber;
}

export function ChooseNumberDialog({
  open,
  businessId,
  isBusy = false,
  title = "Choose a number",
  description = "Pick the SMS number this business will send from.",
  confirmLabel = "Save & continue",
  confirmingLabel = "Saving…",
  dismissible = true,
  onClose,
  onConfirmed,
}: ChooseNumberDialogProps) {
  const titleId = useId();
  const listboxId = useId();
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedSid, setSelectedSid] = useState("");

  const {
    numbers,
    selectedPhoneSid,
    selectedPhoneNumber,
    isLoading,
    error: loadError,
  } = useBusinessTwilioPhoneNumbersQuery(businessId, { enabled: open });

  const associateMutation =
    useAssociateBusinessTwilioPhoneNumberMutation(businessId);

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
    if (!open) {
      setMenuOpen(false);
      setLocalError(null);
      setSelectedSid("");
      return;
    }

    setMenuOpen(false);
    setLocalError(null);
    const preselected =
      selectedPhoneSid?.trim() || numbers[0]?.sid || "";
    setSelectedSid(preselected);
  }, [open, selectedPhoneSid, numbers, setMenuOpen]);

  useEffect(() => {
    if (!open || associateMutation.isPending || isBusy || !dismissible) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menuOpen) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    associateMutation.isPending,
    isBusy,
    onClose,
    menuOpen,
    dismissible,
  ]);

  if (!open) return null;

  const saving = associateMutation.isPending;
  const busy = isLoading || saving || isBusy;
  const selected = numbers.find((n) => n.sid === selectedSid) ?? null;
  const currentOnBusinessSid = selectedPhoneSid?.trim() || null;
  const currentLabel =
    selectedPhoneNumber?.trim() ||
    numbers.find((n) => n.sid === currentOnBusinessSid)?.phoneNumber ||
    null;
  const error =
    localError ||
    loadError ||
    (associateMutation.error
      ? getApiErrorMessage(
          associateMutation.error,
          "Could not associate phone number.",
        )
      : null);

  async function handleConfirm() {
    if (!selected) {
      setLocalError("Select a phone number to continue.");
      return;
    }

    setLocalError(null);
    setMenuOpen(false);
    try {
      await associateMutation.mutateAsync({
        phoneSid: selected.sid,
        phoneNumber: selected.phoneNumber,
      });
      await onConfirmed();
    } catch {
    }
  }

  const triggerDisabled = busy || isLoading || numbers.length === 0;

  const menu =
    menuOpen && menuPosition ? (
      <div ref={menuRef}>
        <motion.ul
          id={listboxId}
          role="listbox"
          aria-label="Phone numbers"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
          style={menuStyle}
          className="max-h-60 overflow-auto rounded-xl border border-zinc-200/90 bg-white py-1.5 shadow-xl ring-1 ring-zinc-950/[0.06]"
        >
          {numbers.map((option, index) => {
            const isSelected = selectedSid === option.sid;
            const isCurrent = currentOnBusinessSid === option.sid;
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
                    setSelectedSid(option.sid);
                    setLocalError(null);
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
                    {isCurrent ? (
                      <span
                        className={`mt-0.5 block truncate text-xs ${
                          isSelected ? "text-[#1877f2]/80" : "text-zinc-500"
                        }`}
                      >
                        In use now
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={busy || !dismissible}
        onClick={() => {
          if (dismissible) onClose();
        }}
        className="absolute inset-0 cursor-default bg-zinc-900/55 backdrop-blur-[3px]"
      />

      <div className="relative w-full max-w-xl overflow-visible rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/10 ring-1 ring-black/5 sm:max-w-2xl">
        {dismissible ? (
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="absolute right-3 top-3 flex size-9 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-[#e8f2ff] hover:text-[#1877f2] disabled:opacity-50 sm:right-5 sm:top-5"
          >
            <X className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}

        <div className="px-6 pb-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex gap-4 pr-10">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-md shadow-[#1877f2]/30"
              aria-hidden
            >
              <Phone className="size-6" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 sm:text-xl"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-[0.95rem]">
                {description}
              </p>
            </div>
          </div>

          {!isLoading && currentLabel ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#1877f2]/25 bg-[#e8f2ff] px-3.5 py-3">
              <span
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white"
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#1877f2]">
                  In use right now
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#0f5ed7]">
                  {currentLabel}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <label
              id={`${listboxId}-label`}
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-zinc-500"
            >
              Phone number
            </label>

            <div ref={anchorRef} className="relative">
              <button
                type="button"
                disabled={triggerDisabled}
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-labelledby={`${listboxId}-label`}
                className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-[#e8edf5] bg-white px-4 text-left shadow-sm outline-none transition hover:border-[#1877f2]/35 hover:bg-[#f8faff] focus-visible:border-[#1877f2]/45 focus-visible:ring-4 focus-visible:ring-[#1877f2]/12 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]"
                  aria-hidden
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
                  ) : (
                    <Phone className="size-4" strokeWidth={2.25} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {isLoading ? (
                    <span className="block text-sm font-medium text-zinc-500">
                      Loading numbers…
                    </span>
                  ) : selected ? (
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {selected.phoneNumber}
                    </span>
                  ) : (
                    <span className="block text-sm font-medium text-zinc-500">
                      {numbers.length === 0
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
              ? createPortal(
                  <AnimatePresence>{menu}</AnimatePresence>,
                  document.body,
                )
              : null}

            {!isLoading && selected ? (
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Selected:{" "}
                <span className="font-semibold text-[#1877f2]">
                  {formatNumberLabel(selected)}
                </span>
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-zinc-100 bg-zinc-50/90 px-6 py-5 sm:px-8">
          {dismissible ? (
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="h-11 cursor-pointer rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || !selected}
            onClick={() => void handleConfirm()}
            className="h-11 cursor-pointer rounded-xl bg-[#1877f2] px-6 text-sm font-semibold text-white shadow-sm shadow-[#1877f2]/25 transition hover:bg-[#166fe5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving || isBusy ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
