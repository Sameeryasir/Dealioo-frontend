"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export function DeleteAutomationDialog({
  open,
  automationName,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  automationName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open || isDeleting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isDeleting, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-automation-title"
    >
      <button
        type="button"
        aria-label="Close dialog"
        disabled={isDeleting}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-[1px]"
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start gap-3 px-5 pt-5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700"
            aria-hidden
          >
            <AlertTriangle className="size-4 shrink-0" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-automation-title"
              className="text-sm font-semibold text-zinc-900"
            >
              Delete automation?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              <span className="font-medium text-zinc-800">{automationName}</span>{" "}
              will be removed permanently. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="cursor-pointer rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
