"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId } from "react";

export function UnpublishCampaignBlockedDialog({
  open,
  activeCount,
  onClose,
}: {
  open: boolean;
  activeCount: number;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const countLabel =
    activeCount === 1
      ? "1 active automation"
      : `${Math.max(activeCount, 2)} active automations`;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-zinc-900/50 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-xl ring-1 ring-black/5">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-900 transition hover:bg-zinc-100 sm:right-4 sm:top-4"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <div className="flex gap-4 pr-8">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-800 shadow-sm"
              aria-hidden
            >
              <AlertTriangle className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-base font-semibold leading-snug text-zinc-900"
              >
                Deactivate automations first
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                This campaign has {countLabel} still running. Deactivate all
                automations for this campaign, then you can unpublish it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
