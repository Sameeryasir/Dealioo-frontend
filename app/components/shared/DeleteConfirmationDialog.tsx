"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { automationEase } from "@/app/lib/motion";

const DEFAULT_DESCRIPTION =
  "This action cannot be undone. Once deleted, this item will be permanently removed from the system.";

export type DeleteConfirmationDialogProps = {
  open: boolean;
  itemName: string;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  checkboxLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmationDialog({
  open,
  itemName,
  title,
  description,
  confirmText = "Delete",
  checkboxLabel,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const titleId = useId();
  const checkboxId = useId();
  const [confirmed, setConfirmed] = useState(false);
  const resolvedTitle = title ?? `Delete ${itemName}?`;
  const resolvedDescription =
    description ?? (
      <>
        <span className="font-semibold text-[#1877f2]">{itemName}</span>,{" "}
        {DEFAULT_DESCRIPTION}
      </>
    );
  const resolvedCheckboxLabel =
    checkboxLabel ?? `Are you sure you want to delete ${itemName}?`;
  const loadingLabel = "Deleting...";
  const canDelete = confirmed && !isLoading;

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      return;
    }
    setConfirmed(false);
  }, [open, itemName]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          {isLoading ? (
            <div
              className="absolute inset-0 bg-[#07111f]/50 backdrop-blur-[6px]"
              aria-hidden
            />
          ) : (
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onCancel}
              className="absolute inset-0 cursor-default bg-[#07111f]/50 backdrop-blur-[6px]"
            />
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[1.25rem] border border-[#e8edf5] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.14),0_0_0_1px_rgba(24,119,242,0.04)] ring-1 ring-black/[0.03]"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.28, ease: automationEase }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background: [
                  "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(24, 119, 242, 0.08) 0%, transparent 60%)",
                  "radial-gradient(ellipse 55% 45% at 0% 100%, rgba(225, 48, 108, 0.05) 0%, transparent 55%)",
                ].join(", "),
              }}
            />

            <div className="relative px-5 pb-3.5 pt-5 sm:px-6 sm:pb-4 sm:pt-5">
              {!isLoading ? (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onCancel}
                  className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#eef5ff] hover:text-[#1877f2] sm:right-4 sm:top-4"
                >
                  <X className="size-4.5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}

              <div className="flex gap-3 pr-8 sm:gap-3.5">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200/90 bg-gradient-to-br from-red-50 to-[#fff1f2] text-red-500 shadow-[0_6px_14px_rgba(239,68,68,0.1)]"
                  aria-hidden
                >
                  <AlertTriangle className="size-4.5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                    id={titleId}
                    className="text-[1rem] font-extrabold leading-snug tracking-tight text-[#07111f] sm:text-[1.05rem]"
                  >
                    {resolvedTitle}
                  </h2>
                  <div className="mt-1.5 max-w-lg text-[0.82rem] leading-relaxed text-slate-500 sm:text-[0.85rem]">
                    {resolvedDescription}
                  </div>
                </div>
              </div>

              <label
                htmlFor={checkboxId}
                className="mt-3.5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#dbeafe] bg-gradient-to-br from-[#f8fbff] to-[#f4f8ff] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#1877f2]/45 hover:shadow-[0_6px_16px_rgba(24,119,242,0.08)]"
              >
                <span className="relative mt-0.5 flex size-4.5 shrink-0 items-center justify-center">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={confirmed}
                    disabled={isLoading}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="peer absolute inset-0 size-4.5 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                  <span className="flex size-4.5 items-center justify-center rounded-md border-2 border-slate-300 bg-white text-transparent shadow-sm transition peer-checked:border-[#1877f2] peer-checked:bg-[#1877f2] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#1877f2]/30 peer-disabled:opacity-50">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                </span>
                <span className="text-[0.82rem] font-bold leading-snug text-[#07111f] sm:text-[0.85rem]">
                  {resolvedCheckboxLabel}
                </span>
              </label>
            </div>

            <div className="relative flex justify-end gap-2 border-t border-[#e8edf5] bg-gradient-to-r from-white via-[#f8fbff] to-white px-5 py-3 sm:px-6">
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-[#e8edf5] bg-white px-4 text-[0.8rem] font-bold text-slate-600 shadow-sm transition hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canDelete}
                onClick={onConfirm}
                className="inline-flex h-9 min-w-[7.5rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#166fe5] px-4 text-[0.8rem] font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#f1f5f9] disabled:text-slate-400 disabled:shadow-none disabled:hover:brightness-100"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden
                      strokeWidth={2}
                    />
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
                    {confirmText}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
