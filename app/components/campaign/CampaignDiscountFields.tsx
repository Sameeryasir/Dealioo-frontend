"use client";

import {
  computeOriginalPriceFromDiscount,
  type CampaignDiscountType,
} from "@/app/lib/campaign-form";
import {
  formatCampaignPrice,
  resolveDealDiscount,
} from "@/app/lib/campaign-price";

type CampaignDiscountFieldsProps = {
  enabled: boolean;
  discountType: CampaignDiscountType;
  discountValue: string;
  dealPrice: string;
  disabled?: boolean;
  idPrefix: string;
  error?: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onTypeChange: (type: CampaignDiscountType) => void;
  onValueChange: (value: string) => void;
  onValueBlur?: () => void;
};

export function CampaignDiscountFields({
  enabled,
  discountType,
  discountValue,
  dealPrice,
  disabled = false,
  idPrefix,
  error = null,
  onEnabledChange,
  onTypeChange,
  onValueChange,
  onValueBlur,
}: CampaignDiscountFieldsProps) {
  const dealNum = Number.parseFloat(dealPrice.trim());
  const discountNum = Number.parseFloat(discountValue.trim());
  const original =
    enabled &&
    Number.isFinite(dealNum) &&
    Number.isFinite(discountNum) &&
    discountNum > 0
      ? computeOriginalPriceFromDiscount({
          dealPrice: dealNum,
          discountType,
          discountValue: discountNum,
        })
      : null;
  const preview =
    original != null
      ? resolveDealDiscount({ price: dealNum, originalPrice: original })
      : null;

  return (
    <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-3.5 sm:col-span-2">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold text-[#07111f]">
            Add discount
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Show a strikethrough price and savings badge to guests.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={disabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-[#1877f2]" : "bg-slate-300"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${
              enabled ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      {enabled ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1 ring-1 ring-[#e8edf5]">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onTypeChange("percent")}
              className={`h-9 rounded-lg text-sm font-semibold transition ${
                discountType === "percent"
                  ? "bg-[#1877f2] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Percentage
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onTypeChange("fixed")}
              className={`h-9 rounded-lg text-sm font-semibold transition ${
                discountType === "fixed"
                  ? "bg-[#1877f2] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Fixed amount
            </button>
          </div>

          <div>
            <label
              htmlFor={`${idPrefix}-discount-value`}
              className="mb-1.5 block text-sm font-semibold text-[#07111f]"
            >
              {discountType === "percent"
                ? "Discount percent"
                : "Discount amount"}
            </label>
            <div className="relative">
              <input
                id={`${idPrefix}-discount-value`}
                type="number"
                step={discountType === "percent" ? "1" : "0.01"}
                min="0"
                max={discountType === "percent" ? "99" : undefined}
                value={discountValue}
                onChange={(e) => onValueChange(e.target.value)}
                onBlur={onValueBlur}
                inputMode="decimal"
                disabled={disabled}
                aria-invalid={Boolean(error)}
                placeholder={discountType === "percent" ? "20" : "5.00"}
                className={`h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-[#07111f] outline-none transition placeholder:text-slate-400 disabled:opacity-60 ${
                  error
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/15"
                }`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-slate-400">
                {discountType === "percent" ? "%" : "$"}
              </span>
            </div>
            {error ? (
              <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                {discountType === "percent"
                  ? "Off the original price. Example: deal $80 + 20% → was $100."
                  : "Added on top of the deal price. Example: deal $20 + $5 → was $25."}
              </p>
            )}
          </div>

          {preview?.hasDiscount && preview.percentOff != null && !error ? (
            <p className="text-xs font-semibold text-emerald-700">
              Guests see {formatCampaignPrice(preview.price)}{" "}
              <span className="text-slate-400 line-through">
                {formatCampaignPrice(preview.originalPrice)}
              </span>{" "}
              · Save {preview.percentOff}%
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
