"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { automationEase } from "@/app/lib/motion";

const DEFAULT_DESCRIPTION =
  "This action cannot be undone. Once deleted, this item will be permanently removed from the system.";

export type DeleteConfirmationDialogProps = {
  open: boolean;
  itemName: string;
  title?: string;
  description?: ReactNode;
  confirmText?: string;
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
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  const titleId = useId();
  const resolvedTitle = title ?? `Delete ${itemName}?`;
  const resolvedDescription =
    description ?? (
      <>
        <span className="font-medium text-zinc-800">{itemName}</span>,{" "}
        {DEFAULT_DESCRIPTION}
      </>
    );
  const loadingLabel = "Deleting...";

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
              className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
              aria-hidden
            />
          ) : (
            <button
              type="button"
              aria-label="Close dialog"
              onClick={onCancel}
              className="absolute inset-0 cursor-default bg-zinc-950/45 backdrop-blur-[2px]"
            />
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl ring-1 ring-zinc-950/5"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: automationEase }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative px-5 pb-4 pt-5 sm:px-6">
              {!isLoading ? (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onCancel}
                  className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 sm:right-4 sm:top-4"
                >
                  <X className="size-5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}

              <div className="flex gap-4 pr-8">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/90 bg-amber-50 text-amber-600 shadow-sm"
                  aria-hidden
                >
                  <AlertTriangle className="size-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    id={titleId}
                    className="text-base font-semibold leading-snug text-zinc-900"
                  >
                    {resolvedTitle}
                  </h2>
                  <div className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {resolvedDescription}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/60 px-5 py-3.5 sm:px-6">
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className="inline-flex h-10 min-w-[7.5rem] cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:hover:bg-zinc-200"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden
                      strokeWidth={2}
                    />
                    {loadingLabel}
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" strokeWidth={2} aria-hidden />
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
