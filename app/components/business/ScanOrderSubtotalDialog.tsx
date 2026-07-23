"use client";

import { useState } from "react";

type ScanOrderSubtotalDialogProps = {
  confirming: boolean;
  requirePositiveAmount?: boolean;
  expectedAmount?: number | null;
  /** Prepaid redeem: optional extra items paid in-store today. */
  extraPurchaseMode?: boolean;
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

function amountsMatch(left: number, right: number): boolean {
  return Math.round(left * 100) === Math.round(right * 100);
}

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function sanitizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) {
    return cleaned.replace(/^0+(?=\d)/, "") || cleaned;
  }

  const whole = cleaned.slice(0, firstDot).replace(/^0+(?=\d)/, "") || "0";
  const fraction = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, 2);
  return `${whole}.${fraction}`;
}

export function ScanOrderSubtotalDialog({
  confirming,
  requirePositiveAmount = false,
  expectedAmount = null,
  extraPurchaseMode = false,
  onBack,
  onDone,
  onDismiss,
}: ScanOrderSubtotalDialogProps) {
  const [subtotalInput, setSubtotalInput] = useState("");
  const parsedSubtotal = parseSubtotal(subtotalInput);
  const hasExpectedAmount =
    !extraPurchaseMode &&
    expectedAmount != null &&
    Number.isFinite(expectedAmount) &&
    expectedAmount >= 0;
  const matchesExpected =
    parsedSubtotal != null &&
    hasExpectedAmount &&
    amountsMatch(parsedSubtotal, expectedAmount!);
  const amountMismatch =
    parsedSubtotal != null && hasExpectedAmount && !matchesExpected;

  const resolvedAmount =
    extraPurchaseMode && parsedSubtotal === null ? 0 : parsedSubtotal;

  const canSubmit = extraPurchaseMode
    ? resolvedAmount !== null && resolvedAmount >= 0
    : parsedSubtotal !== null &&
      (!requirePositiveAmount || parsedSubtotal > 0) &&
      (!hasExpectedAmount || matchesExpected);

  const title = extraPurchaseMode
    ? "Anything else today?"
    : requirePositiveAmount
      ? "Enter the amount the guest paid today (exclude tax & tip)"
      : "Enter the subtotal of their entire order (exclude tax & tip)";

  const fieldLabel = extraPurchaseMode
    ? "Extra items amount ($)"
    : "Entire Order Subtotal ($)";

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
          {title}
        </h2>

        {extraPurchaseMode ? (
          <p className="mt-3 text-sm font-medium text-slate-600">
            Enter what they paid for any other items today (exclude tax & tip),
            or leave blank / enter 0 if nothing else.
          </p>
        ) : null}

        {hasExpectedAmount ? (
          <p className="mt-3 text-sm font-medium text-slate-600">
            Campaign price:{" "}
            <span className="font-bold text-[#07111f]">
              {formatMoney(expectedAmount!)}
            </span>
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Enter exactly this amount to continue.
            </span>
          </p>
        ) : null}

        <div className="relative mt-8">
          <input
            id="order-subtotal"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]{0,2}"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={subtotalInput}
            onChange={(event) =>
              setSubtotalInput(sanitizeMoneyInput(event.target.value))
            }
            onKeyDown={(event) => {
              if (
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.key === "Backspace" ||
                event.key === "Delete" ||
                event.key === "Tab" ||
                event.key === "Enter" ||
                event.key === "ArrowLeft" ||
                event.key === "ArrowRight" ||
                event.key === "Home" ||
                event.key === "End"
              ) {
                return;
              }
              if (event.key.length === 1 && !/[0-9.]/.test(event.key)) {
                event.preventDefault();
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const pasted = event.clipboardData.getData("text");
              setSubtotalInput(sanitizeMoneyInput(pasted));
            }}
            placeholder="0.00"
            className={`peer w-full rounded-lg border-2 px-4 pb-3 pt-6 text-base outline-none ${
              amountMismatch
                ? "border-amber-500 text-zinc-900"
                : matchesExpected
                  ? "border-emerald-500 text-zinc-900"
                  : "border-blue-600 text-zinc-900"
            }`}
          />
          <label
            htmlFor="order-subtotal"
            className={`pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-sm font-medium ${
              amountMismatch
                ? "text-amber-700"
                : matchesExpected
                  ? "text-emerald-700"
                  : "text-blue-600"
            }`}
          >
            {fieldLabel}
          </label>
        </div>

        {!extraPurchaseMode &&
        requirePositiveAmount &&
        parsedSubtotal === 0 ? (
          <p className="mt-3 text-sm text-amber-700">
            Enter an amount greater than zero to complete walk-in payment.
          </p>
        ) : null}

        {amountMismatch && parsedSubtotal != null ? (
          <p className="mt-3 text-sm font-medium text-amber-800">
            {parsedSubtotal > expectedAmount!
              ? `Entered amount (${formatMoney(parsedSubtotal)}) is more than the campaign price (${formatMoney(expectedAmount!)}).`
              : `Entered amount (${formatMoney(parsedSubtotal)}) is less than the campaign price (${formatMoney(expectedAmount!)}).`}
          </p>
        ) : null}

        {matchesExpected ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            Amount matches the campaign price.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className="min-w-24 rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {extraPurchaseMode ? (
              <button
                type="button"
                onClick={() => onDone(0)}
                disabled={confirming}
                className="min-w-24 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                Nothing else
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (resolvedAmount === null || !canSubmit) return;
                onDone(resolvedAmount);
              }}
              disabled={!canSubmit || confirming}
              className="min-w-24 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? "Saving…" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
