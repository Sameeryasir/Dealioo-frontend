"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  HandCoins,
  Info,
  Megaphone,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { resolveUploadImageUrl } from "@/app/lib/resolve-upload-image-url";

export type ScanOrderExtraItem = {
  name: string;
  unitPrice: number;
  qty: number;
};

export type ScanOrderExtraMeta = {
  itemNames?: string[];
  items?: ScanOrderExtraItem[];
};

export type ScanOrderDealSummary = {
  name: string;
  imageUrl?: string | null;
  priceLabel?: string | null;
  description?: string | null;
};

type ScanOrderSubtotalDialogProps = {
  confirming: boolean;
  requirePositiveAmount?: boolean;
  expectedAmount?: number | null;
  initialAmount?: number | null;
  dealSummary?: ScanOrderDealSummary | null;
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

export function ScanOrderSubtotalDialog({
  confirming,
  requirePositiveAmount = false,
  expectedAmount = null,
  initialAmount = null,
  dealSummary = null,
  extraPurchaseMode = false,
  onBack,
  onDone,
  onDismiss,
}: ScanOrderSubtotalDialogProps) {
  const [subtotalInput, setSubtotalInput] = useState(() =>
    initialAmount != null && Number.isFinite(initialAmount) && initialAmount >= 0
      ? initialAmount.toFixed(2)
      : "",
  );
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

  const dealImageSrc = resolveUploadImageUrl(dealSummary?.imageUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e182b]/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-order-subtotal-title"
        className={`w-full bg-white ${
          extraPurchaseMode
            ? "max-w-xl overflow-hidden rounded-[1.5rem] border border-[#e8edf5] shadow-[0_28px_70px_rgba(14,24,43,0.28)]"
            : "max-w-[36rem] overflow-hidden rounded-[1.5rem] border border-[#e8edf5] shadow-[0_28px_70px_rgba(14,24,43,0.28)]"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {extraPurchaseMode ? (
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(160deg,#f7fbff_0%,#e8f1ff_100%)] text-[#1777f2] ring-1 ring-[#dbeafe]">
                  <ShoppingBag className="size-5" strokeWidth={2.15} aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2
                    id="scan-order-subtotal-title"
                    className="text-[1.25rem] font-extrabold tracking-tight text-[#0e182b]"
                  >
                    {title}
                  </h2>
                  <p className="mt-1 text-[0.82rem] font-medium text-slate-500">
                    Add extra items, or skip if there are none.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                disabled={confirming}
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            <div className="mt-5">
              <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-0.5">
                {lineItems.map((item, index) => (
                  <div key={`extra-item-${index}`}>
                    <p className="mb-1.5 text-[0.72rem] font-semibold text-slate-400">
                      Item {index + 1}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dbeafe] bg-[#f3f8ff] p-2.5 sm:flex-nowrap">
                      <label className="relative min-w-[10rem] flex-1">
                        <span className="sr-only">Product name</span>
                        <Package
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1777f2]"
                          strokeWidth={2.1}
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
                          className="w-full rounded-xl border border-[#dbeafe] bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-[#0e182b] outline-none placeholder:text-slate-400 focus:border-[#1777f2] focus:ring-2 focus:ring-[#1777f2]/15"
                        />
                      </label>

                      <div className="flex h-[2.625rem] shrink-0 items-center overflow-hidden rounded-xl border border-[#dbeafe] bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={confirming || item.qty <= 1}
                          onClick={() =>
                            updateLineItem(index, {
                              qty: clampQty(item.qty - 1),
                            })
                          }
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-[#eff6ff] disabled:opacity-40"
                        >
                          <Minus
                            className="size-3.5"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </button>
                        <label className="relative h-full w-10 border-x border-[#dbeafe]">
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
                            className="h-full w-full bg-transparent text-center text-sm font-bold tabular-nums text-[#0e182b] outline-none"
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
                          className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-[#eff6ff] disabled:opacity-40"
                        >
                          <Plus
                            className="size-3.5"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </button>
                      </div>

                      <label className="relative w-[7rem] shrink-0">
                        <span className="sr-only">Unit price</span>
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
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
                          className="w-full rounded-xl border border-[#dbeafe] bg-white py-2.5 pl-7 pr-2 text-sm font-bold tabular-nums text-[#0e182b] outline-none placeholder:text-slate-400 focus:border-[#1777f2] focus:ring-2 focus:ring-[#1777f2]/15"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeOrClearLine(index)}
                        disabled={confirming}
                        aria-label={`Remove item ${index + 1}`}
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}
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
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#93c5fd] bg-[#f8fbff] px-4 py-2.5 text-sm font-bold text-[#1777f2] transition hover:bg-[#eff6ff] disabled:opacity-50"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden />
                  Add another item
                </button>
              ) : null}

              {extrasHasPartialRow ? (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Each product needs both a name and a price, or clear the empty
                  side.
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3.5">
                <span className="inline-flex items-center gap-2 text-[0.9rem] font-extrabold text-[#0e182b]">
                  <Coins
                    className="size-4.5 text-[#1777f2]"
                    strokeWidth={2.15}
                    aria-hidden
                  />
                  Add-on total
                </span>
                <span className="text-[1.15rem] font-extrabold tabular-nums tracking-tight text-[#1777f2]">
                  {formatMoney(extrasTotal)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={confirming}
                className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl border border-[#0e182b] bg-white px-5 py-2.5 text-[0.86rem] font-bold text-[#0e182b] transition hover:bg-[#f8fafc] disabled:opacity-50"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2.25} aria-hidden />
                Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDone(0)}
                  disabled={confirming}
                  className="min-w-28 rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-[0.86rem] font-bold text-[#0e182b] transition hover:bg-[#f8fafc] disabled:opacity-50"
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
                  className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl bg-[#1777f2] px-5 py-2.5 text-[0.9rem] font-bold text-white shadow-[0_10px_24px_rgba(23,119,242,0.28)] transition hover:bg-[#1569e0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  {confirming
                    ? "Saving…"
                    : extrasTotal > 0
                      ? `Done · ${formatMoney(extrasTotal)}`
                      : "Done"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] bg-[linear-gradient(160deg,#f7fbff_0%,#e8f1ff_100%)] text-[#1777f2] ring-1 ring-[#dbeafe]">
                  <span
                    className="absolute right-1.5 top-1.5 flex flex-col gap-[2px]"
                    aria-hidden
                  >
                    <span className="h-[1.5px] w-1.5 rotate-12 rounded-full bg-[#93c5fd]" />
                    <span className="ml-0.5 h-[1.5px] w-1 rotate-12 rounded-full bg-[#93c5fd]" />
                    <span className="h-[1.5px] w-2 rotate-12 rounded-full bg-[#93c5fd]" />
                  </span>
                  <HandCoins className="relative size-5" strokeWidth={2.15} aria-hidden />
                </span>
                <div className="min-w-0 pr-2 pt-0.5">
                  <h2
                    id="scan-order-subtotal-title"
                    className="whitespace-nowrap text-[1.05rem] font-extrabold leading-[1.3] tracking-tight text-[#0e182b] sm:text-[1.15rem]"
                  >
                    {title}
                  </h2>
                  <p className="mt-1.5 text-pretty text-[0.78rem] font-medium leading-relaxed text-slate-500">
                    {hasExpectedAmount
                      ? "Enter the exact amount collected from the guest to continue."
                      : requirePositiveAmount
                        ? "Enter the amount you collected for this offer (exclude tax & tip)."
                        : "Enter the subtotal of their entire order (exclude tax & tip)."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                disabled={confirming}
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            {dealSummary ? (
              <div className="mt-5 flex items-stretch gap-3 rounded-2xl border border-[#dbeafe] bg-[#f3f8ff] px-3.5 py-3.5">
                <span className="flex size-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[#1777f2] ring-1 ring-[#dbeafe]">
                  {dealImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dealImageSrc}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Megaphone
                      className="size-5"
                      strokeWidth={2.1}
                      aria-hidden
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="m-0 truncate text-[0.95rem] font-extrabold tracking-tight text-[#0e182b]">
                    {dealSummary.name}
                  </p>
                  <p className="m-0 mt-1.5 text-pretty text-[0.72rem] font-medium leading-snug text-slate-500">
                    {dealSummary.description?.trim() ||
                      "Attach this published deal to the guest."}
                  </p>
                </div>
                <div
                  className="hidden w-px shrink-0 self-stretch bg-[#dbeafe] sm:block"
                  aria-hidden
                />
                <div className="hidden w-[7.25rem] shrink-0 flex-col items-center justify-center gap-1 px-1 text-center sm:flex">
                  <span className="flex size-8 items-center justify-center rounded-full bg-white text-[#1777f2] ring-1 ring-[#dbeafe]">
                    <Tag className="size-3.5" strokeWidth={2.2} aria-hidden />
                  </span>
                  <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-slate-400">
                    Deal price
                  </p>
                  <p className="m-0 text-[0.92rem] font-extrabold tabular-nums tracking-tight text-[#1777f2]">
                    {dealSummary.priceLabel ||
                      (hasExpectedAmount
                        ? formatMoney(expectedAmount!)
                        : "—")}
                  </p>
                </div>
              </div>
            ) : hasExpectedAmount ? (
              <div className="mt-5 rounded-2xl border border-[#dbeafe] bg-[#f3f8ff] px-4 py-3.5">
                <p className="m-0 text-sm font-medium text-slate-600">
                  Deal price:{" "}
                  <span className="font-extrabold text-[#0e182b]">
                    {formatMoney(expectedAmount!)}
                  </span>
                </p>
                <p className="m-0 mt-1 text-xs font-medium text-slate-500">
                  Enter exactly this amount to continue.
                </p>
              </div>
            ) : null}

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="order-subtotal"
                  className="text-[0.82rem] font-extrabold text-[#0e182b]"
                >
                  {fieldLabel}
                </label>
                {hasExpectedAmount ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSubtotalInput(expectedAmount!.toFixed(2))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8f1ff] px-2.5 py-1 text-[0.72rem] font-bold text-[#1777f2] transition hover:bg-[#dbeafe]"
                  >
                    <Calculator
                      className="size-3.5"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    Use exact amount {formatMoney(expectedAmount!)}
                  </button>
                ) : null}
              </div>

              <div
                className={`flex overflow-hidden rounded-xl border-2 bg-white ${
                  amountMismatch
                    ? "border-amber-400"
                    : matchesExpected
                      ? "border-emerald-400"
                      : "border-[#1777f2]"
                }`}
              >
                <span className="flex w-11 shrink-0 items-center justify-center bg-[#f1f5f9] text-[0.95rem] font-bold text-slate-500">
                  $
                </span>
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
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-[1.05rem] font-extrabold tabular-nums tracking-tight text-[#0e182b] outline-none"
                />
                <div className="flex w-9 shrink-0 flex-col border-l border-[#e2e8f0]">
                  <button
                    type="button"
                    aria-label="Increase amount"
                    disabled={confirming}
                    onClick={() => {
                      const current = parseSubtotal(subtotalInput) ?? 0;
                      setSubtotalInput(
                        (Math.round((current + 0.01) * 100) / 100).toFixed(2),
                      );
                    }}
                    className="flex flex-1 items-center justify-center text-slate-500 transition hover:bg-[#f8fafc] hover:text-[#1777f2] disabled:opacity-50"
                  >
                    <ChevronUp className="size-3.5" strokeWidth={2.5} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Decrease amount"
                    disabled={confirming}
                    onClick={() => {
                      const current = parseSubtotal(subtotalInput) ?? 0;
                      setSubtotalInput(
                        (
                          Math.max(0, Math.round((current - 0.01) * 100) / 100)
                        ).toFixed(2),
                      );
                    }}
                    className="flex flex-1 items-center justify-center border-t border-[#e2e8f0] text-slate-500 transition hover:bg-[#f8fafc] hover:text-[#1777f2] disabled:opacity-50"
                  >
                    <ChevronDown
                      className="size-3.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  </button>
                </div>
              </div>

              {hasExpectedAmount ? (
                <p className="mt-2.5 flex items-start gap-1.5 text-[0.74rem] font-medium leading-snug text-[#1777f2]">
                  <Info
                    className="mt-0.5 size-3.5 shrink-0"
                    strokeWidth={2.1}
                    aria-hidden
                  />
                  <span>
                    This amount should match the exact deal price.
                  </span>
                </p>
              ) : null}

              {requirePositiveAmount && parsedSubtotal === 0 ? (
                <p className="mt-2 text-[0.8rem] font-medium leading-snug text-amber-700">
                  Enter an amount greater than zero to complete walk-in payment.
                </p>
              ) : null}

              {amountMismatch && parsedSubtotal != null ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[0.78rem] font-semibold leading-snug text-amber-800 ring-1 ring-amber-100">
                  {parsedSubtotal > expectedAmount! ? (
                    <>
                      Entered amount{" "}
                      <span className="font-extrabold tabular-nums">
                        ({formatMoney(parsedSubtotal)})
                      </span>{" "}
                      is more than the deal price{" "}
                      <span className="font-extrabold tabular-nums">
                        ({formatMoney(expectedAmount!)})
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Entered amount{" "}
                      <span className="font-extrabold tabular-nums">
                        ({formatMoney(parsedSubtotal)})
                      </span>{" "}
                      is less than the deal price{" "}
                      <span className="font-extrabold tabular-nums">
                        ({formatMoney(expectedAmount!)})
                      </span>
                      .
                    </>
                  )}
                </p>
              ) : null}

              {matchesExpected ? (
                <p className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[0.8rem] font-bold leading-snug text-emerald-700 ring-1 ring-emerald-100">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  Amount matches the deal price
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                disabled={confirming}
                className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl border border-[#0e182b] bg-white px-5 py-2.5 text-[0.86rem] font-bold text-[#0e182b] transition hover:bg-[#f8fafc] disabled:opacity-50"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2.25} aria-hidden />
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resolvedAmount === null || !canSubmit) return;
                  submitAmount(resolvedAmount);
                }}
                disabled={!canSubmit || confirming}
                className="inline-flex min-w-28 items-center justify-center gap-1.5 rounded-xl bg-[#1777f2] px-6 py-2.5 text-[0.9rem] font-bold text-white shadow-[0_10px_24px_rgba(23,119,242,0.3)] transition hover:bg-[#1569e0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                {confirming ? "Saving…" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
