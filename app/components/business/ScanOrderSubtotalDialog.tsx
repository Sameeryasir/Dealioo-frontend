"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Box, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";

export type ScanOrderExtraItem = {
  name: string;
  unitPrice: number;
  qty: number;
};

export type ScanOrderExtraMeta = {
  itemNames?: string[];
  items?: ScanOrderExtraItem[];
};

type ScanOrderSubtotalDialogProps = {
  confirming: boolean;
  requirePositiveAmount?: boolean;
  expectedAmount?: number | null;
  extraPurchaseMode?: boolean;
  onBack: () => void;
  onDone: (orderSubtotal: number, meta?: ScanOrderExtraMeta) => void;
  onDismiss: () => void;
};

type ExtraLineItem = {
  name: string;
  price: string;
  qty: number;
};

const MAX_QTY = 99;

function clampQty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(value)));
}

function sanitizeQtyInput(raw: string): number {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (!digits) return 1;
  return clampQty(Number.parseInt(digits, 10));
}

function buildExtraItemLabels(items: ExtraLineItem[]): string[] {
  const labels: string[] = [];
  for (const item of items) {
    const name = item.name.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const qty = clampQty(item.qty);
    const label = qty > 1 ? `${name} × ${qty}` : name;
    labels.push(label.slice(0, 120));
    if (labels.length >= 20) break;
  }
  return normalizeItemNames(labels);
}

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

function normalizeItemNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name.slice(0, 120));
    if (out.length >= 20) break;
  }
  return out;
}

function moneyKeyDown(event: KeyboardEvent<HTMLInputElement>) {
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
}

function ShoppingBagsArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M58 18c0-6 4.5-10 10-10s10 4 10 10"
        stroke="#93C5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 22c0-5.5 4-9.5 9-9.5s9 4 9 9.5"
        stroke="#93C5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="14"
        y="22"
        width="34"
        height="40"
        rx="8"
        fill="#DBEAFE"
        stroke="#60A5FA"
        strokeWidth="2"
      />
      <rect
        x="48"
        y="16"
        width="34"
        height="46"
        rx="8"
        fill="#EFF6FF"
        stroke="#3B82F6"
        strokeWidth="2"
      />
      <path
        d="M56 28h18M56 36h14"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 34h18M22 42h12"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M68 8l2 4 4 .5-3 3 .8 4-3.8-2.2L64 19.5l.8-4-3-3 4-.5 2-4z"
        fill="#93C5FD"
      />
      <path
        d="M84 20l1.2 2.4 2.6.3-2 1.8.5 2.5-2.3-1.3-2.3 1.3.5-2.5-2-1.8 2.6-.3L84 20z"
        fill="#BFDBFE"
      />
    </svg>
  );
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
  const [lineItems, setLineItems] = useState<ExtraLineItem[]>([
    { name: "", price: "", qty: 1 },
  ]);

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

  const extrasTotal = useMemo(() => {
    let totalCents = 0;
    for (const item of lineItems) {
      const price = parseSubtotal(item.price);
      if (price == null) continue;
      const qty = clampQty(item.qty);
      totalCents += Math.round(price * 100) * qty;
    }
    return Math.round(totalCents) / 100;
  }, [lineItems]);

  const extrasNames = useMemo(
    () => buildExtraItemLabels(lineItems),
    [lineItems],
  );

  const structuredExtras = useMemo((): ScanOrderExtraItem[] => {
    const out: ScanOrderExtraItem[] = [];
    for (const item of lineItems) {
      const name = item.name.trim().replace(/\s+/g, " ");
      const price = parseSubtotal(item.price);
      if (!name || price == null || price <= 0) continue;
      out.push({
        name: name.slice(0, 120),
        unitPrice: price,
        qty: clampQty(item.qty),
      });
      if (out.length >= 20) break;
    }
    return out;
  }, [lineItems]);

  const extrasHasPartialRow = lineItems.some((item) => {
    const hasName = item.name.trim().length > 0;
    const price = parseSubtotal(item.price);
    const hasPrice = price != null && price > 0;
    return (hasName && !hasPrice) || (!hasName && hasPrice);
  });

  const resolvedAmount = extraPurchaseMode ? extrasTotal : parsedSubtotal;

  const canSubmit = extraPurchaseMode
    ? !extrasHasPartialRow && extrasTotal >= 0
    : parsedSubtotal !== null &&
      (!requirePositiveAmount || parsedSubtotal > 0) &&
      (!hasExpectedAmount || matchesExpected);

  const title = extraPurchaseMode
    ? "Anything else today?"
    : requirePositiveAmount
      ? "Enter the offer amount collected at the location"
      : "Enter the subtotal of their entire order (exclude tax & tip)";

  const fieldLabel = requirePositiveAmount
    ? "Offer amount ($)"
    : "Entire Order Subtotal ($)";

  const updateLineItem = (index: number, patch: Partial<ExtraLineItem>) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, ...patch };
      return next;
    });
  };

  const removeOrClearLine = (index: number) => {
    setLineItems((prev) => {
      if (prev.length <= 1) {
        return [{ name: "", price: "", qty: 1 }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const submitAmount = (amount: number) => {
    if (extraPurchaseMode) {
      onDone(
        amount,
        amount > 0 && structuredExtras.length > 0
          ? {
              items: structuredExtras,
              itemNames: extrasNames,
            }
          : undefined,
      );
      return;
    }
    onDone(amount);
  };

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
        className={`w-full rounded-2xl bg-white shadow-2xl ${
          extraPurchaseMode ? "max-w-xl p-5 sm:p-6" : "max-w-lg p-6"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {extraPurchaseMode ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FF]">
                <ShoppingCart
                  className="size-5 text-[#2563EB]"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </div>
              <button
                type="button"
                onClick={onDismiss}
                disabled={confirming}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            <div className="relative mt-3 pr-[5.5rem] sm:pr-28">
              <h2
                id="scan-order-subtotal-title"
                className="text-[1.65rem] font-bold leading-tight tracking-tight text-zinc-900"
              >
                {title}
              </h2>
              <ShoppingBagsArt className="pointer-events-none absolute -right-1 top-0 h-[4.5rem] w-[5.75rem] sm:h-20 sm:w-24" />
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  Add-on items
                </p>
              </div>

              <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-0.5">
                {lineItems.map((item, index) => {
                  const unitPrice = parseSubtotal(item.price);
                  const lineTotal =
                    unitPrice != null
                      ? Math.round(unitPrice * 100 * clampQty(item.qty)) / 100
                      : null;

                  return (
                  <div
                    key={`extra-item-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5"
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Item {index + 1}
                      </p>
                      {lineTotal != null && lineTotal > 0 ? (
                        <p className="text-xs font-semibold tabular-nums text-slate-500">
                          Line {formatMoney(lineTotal)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-stretch gap-2">
                      <label className="relative min-w-[10rem] flex-1 basis-[12rem]">
                        <span className="sr-only">Product name</span>
                        <Box
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                          aria-hidden
                        />
                        <input
                          id={`extra-item-name-${index}`}
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          maxLength={120}
                          value={item.name}
                          onChange={(event) =>
                            updateLineItem(index, {
                              name: event.target.value,
                            })
                          }
                          placeholder="Product name"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                        />
                      </label>

                      <div className="flex h-[2.625rem] shrink-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={confirming || item.qty <= 1}
                          onClick={() =>
                            updateLineItem(index, {
                              qty: clampQty(item.qty - 1),
                            })
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Minus className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </button>
                        <label className="relative h-full w-10 border-x border-slate-200">
                          <span className="sr-only">Quantity</span>
                          <input
                            id={`extra-item-qty-${index}`}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={String(item.qty)}
                            onChange={(event) =>
                              updateLineItem(index, {
                                qty: sanitizeQtyInput(event.target.value),
                              })
                            }
                            className="h-full w-full bg-transparent text-center text-sm font-semibold tabular-nums text-zinc-900 outline-none"
                          />
                        </label>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={confirming || item.qty >= MAX_QTY}
                          onClick={() =>
                            updateLineItem(index, {
                              qty: clampQty(item.qty + 1),
                            })
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>

                      <label className="relative w-[6.5rem] shrink-0">
                        <span className="sr-only">Unit price</span>
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-800">
                          $
                        </span>
                        <input
                          id={`extra-item-price-${index}`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={item.price}
                          onChange={(event) =>
                            updateLineItem(index, {
                              price: sanitizeMoneyInput(event.target.value),
                            })
                          }
                          onKeyDown={moneyKeyDown}
                          onPaste={(event) => {
                            event.preventDefault();
                            updateLineItem(index, {
                              price: sanitizeMoneyInput(
                                event.clipboardData.getData("text"),
                              ),
                            });
                          }}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-7 pr-2 text-sm tabular-nums text-zinc-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeOrClearLine(index)}
                        disabled={confirming}
                        aria-label={`Remove item ${index + 1}`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>

              {lineItems.length < 20 ? (
                <button
                  type="button"
                  onClick={() =>
                    setLineItems((prev) => [
                      ...prev,
                      { name: "", price: "", qty: 1 },
                    ])
                  }
                  disabled={confirming}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#93C5FD] bg-[#F3F8FF] px-4 py-3 text-sm font-semibold text-[#2563EB] transition hover:bg-[#E8F0FF] disabled:opacity-50"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-white">
                    <Plus className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  Add another item
                </button>
              ) : null}

              {extrasHasPartialRow ? (
                <p className="mt-2 text-sm text-amber-700">
                  Each product needs both a name and a price, or clear the empty
                  side.
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#EEF4FF] px-4 py-3.5">
                <span className="text-sm font-semibold text-slate-700">
                  Add-on total
                </span>
                <span className="text-base font-bold tabular-nums text-zinc-900">
                  {formatMoney(extrasTotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={confirming}
                className="min-w-24 rounded-xl border border-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
              >
                Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDone(0)}
                  disabled={confirming}
                  className="min-w-28 rounded-xl bg-[#E8F0FF] px-5 py-2.5 text-sm font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE] disabled:opacity-50"
                >
                  Nothing else
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (resolvedAmount === null || !canSubmit) return;
                    submitAmount(resolvedAmount);
                  }}
                  disabled={!canSubmit || confirming}
                  className="min-w-24 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming
                    ? "Saving…"
                    : extrasTotal > 0
                      ? `Done · ${formatMoney(extrasTotal)}`
                      : "Done"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2
              id="scan-order-subtotal-title"
              className="text-2xl font-semibold tracking-tight text-zinc-900"
            >
              {title}
            </h2>

            {requirePositiveAmount && !hasExpectedAmount ? (
              <p className="mt-3 text-sm font-medium text-slate-600">
                Enter the amount you collected for this offer (exclude tax &
                tip).
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
                onKeyDown={moneyKeyDown}
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

            {requirePositiveAmount && parsedSubtotal === 0 ? (
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
              <button
                type="button"
                onClick={() => {
                  if (resolvedAmount === null || !canSubmit) return;
                  submitAmount(resolvedAmount);
                }}
                disabled={!canSubmit || confirming}
                className="min-w-24 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? "Saving…" : "Done"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
