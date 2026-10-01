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
        className="absolute inset-0 cursor-default bg-zinc-900/45 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-[32rem] overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <div className="px-6 pb-2 pt-7 sm:px-7 sm:pt-8">
          <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" strokeWidth={2.25} aria-hidden />
          </div>
          <h2
            id={titleId}
            className="pr-8 text-lg font-semibold tracking-tight text-[#07111f]"
          >
            Deactivate automations first
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This campaign has {countLabel} still running. Deactivate them, then
            you can unpublish.
          </p>
        </div>

        <div className="flex justify-end border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-10 cursor-pointer rounded-xl bg-[#07111f] px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
