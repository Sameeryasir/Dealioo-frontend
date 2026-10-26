"use client";

import { Keyboard, X } from "lucide-react";
import { useId, useState } from "react";
import {
  scannerPrimaryBtnClass,
  scannerSecondaryBtnClass,
} from "@/app/lib/scanner-ui";

type ScannerManualEntryDialogProps = {
  open: boolean;
  submitting?: boolean;
  onSubmit: (rawToken: string) => void;
  onDismiss: () => void;
};

function ManualEntryForm({
  submitting,
  onSubmit,
  onDismiss,
}: {
  submitting: boolean;
  onSubmit: (rawToken: string) => void;
  onDismiss: () => void;
}) {
  const titleId = useId();
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSubmit = trimmed.length >= 8 && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e182b]/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_24px_64px_rgba(14,24,43,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef2f7] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1777f2]">
              <Keyboard className="size-5" strokeWidth={2.1} aria-hidden />
            </span>
            <div>
              <h2
                id={titleId}
                className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#0e182b]"
              >
                Enter code manually
              </h2>
              <p className="m-0 mt-1 text-[0.8rem] font-medium text-slate-500">
                Paste the guest pass token or QR payload. Same validation as a
                camera scan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#0e182b]"
            aria-label="Close manual entry"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <form
          className="px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            onSubmit(trimmed);
          }}
        >
          <label
            htmlFor="scanner-manual-token"
            className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-500"
          >
            Pass token
          </label>
          <input
            id="scanner-manual-token"
            type="text"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={value}
            disabled={submitting}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Paste QR token…"
            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-3 text-[0.88rem] font-medium text-[#0e182b] outline-none transition placeholder:text-slate-400 focus:border-[#1777f2]/55 focus:ring-2 focus:ring-[#1777f2]/15"
          />
          <p className="m-0 mt-2 text-[0.72rem] font-medium text-slate-400">
            Minimum 8 characters. Token is only sent to your business redemption
            API.
          </p>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onDismiss}
              disabled={submitting}
              className={scannerSecondaryBtnClass}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={scannerPrimaryBtnClass}
            >
              {submitting ? "Checking…" : "Look up pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ScannerManualEntryDialog({
  open,
  submitting = false,
  onSubmit,
  onDismiss,
}: ScannerManualEntryDialogProps) {
  if (!open) return null;

  return (
    <ManualEntryForm
      submitting={submitting}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
    />
  );
}
