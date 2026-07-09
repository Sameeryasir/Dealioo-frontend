"use client";

import { useState } from "react";

type ScanOrderSubtotalDialogProps = {
  confirming: boolean;
  /** When true, amount must be greater than zero (walk-in payment for unpaid guests). */
  requirePositiveAmount?: boolean;
  onBack: () => void;
  onDone: (orderSubtotal: number) => void;
  onDismiss: () => void;
};

function parseSubtotal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number.parseFloat(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.round(parsed * 100) / 100;
}

export function ScanOrderSubtotalDialog({
  confirming,
  requirePositiveAmount = false,
  onBack,
  onDone,
  onDismiss,
}: ScanOrderSubtotalDialogProps) {
  const [subtotalInput, setSubtotalInput] = useState("");
  const parsedSubtotal = parseSubtotal(subtotalInput);
  const canSubmit =
    parsedSubtotal !== null &&
    (!requirePositiveAmount || parsedSubtotal > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-order-subtotal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="scan-order-subtotal-title"
          className="text-2xl font-semibold tracking-tight text-zinc-900"
        >
          {requirePositiveAmount
            ? "Enter the amount the guest paid today (exclude tax & tip)"
            : "Enter the subtotal of their entire order (exclude tax & tip)"}
        </h2>

        <div className="relative mt-8">
          <input
            id="order-subtotal"
            type="text"
            inputMode="decimal"
            value={subtotalInput}
            onChange={(event) => setSubtotalInput(event.target.value)}
            placeholder="0.00"
            className="peer w-full rounded-lg border-2 border-blue-600 px-4 pb-3 pt-6 text-base text-zinc-900 outline-none"
          />
          <label
            htmlFor="order-subtotal"
            className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-sm font-medium text-blue-600"
          >
            Entire Order Subtotal ($)
          </label>
        </div>

        {requirePositiveAmount && parsedSubtotal === 0 ? (
          <p className="mt-3 text-sm text-amber-700">
            Enter an amount greater than zero to complete walk-in payment.
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className="min-w-24 rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (parsedSubtotal === null) return;
              onDone(parsedSubtotal);
            }}
            disabled={!canSubmit || confirming}
            className="min-w-24 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
