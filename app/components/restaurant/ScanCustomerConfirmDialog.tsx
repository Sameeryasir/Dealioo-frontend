"use client";

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Gift,
  History,
  Mail,
  Megaphone,
  ScanLine,
  UserRound,
} from "lucide-react";
import { formatDateTimeShort } from "@/app/lib/datetime";
import { ScanStatusBadges } from "@/app/components/restaurant/ScanStatusBadges";
import type { ScanPreviewSuccess } from "@/app/services/redemption/scan-redemption";

type ScanCustomerConfirmDialogProps = {
  preview: ScanPreviewSuccess;
  confirming: boolean;
  showPreviousRedemptions: boolean;
  onTogglePreviousRedemptions: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
};

function canEnableRedeem(preview: ScanPreviewSuccess): boolean {
  return (
    preview.paymentStatus === "PAID" &&
    preview.couponStatus === "ACTIVE" &&
    !preview.couponExpired &&
    (preview.canRedeem ||
      preview.availableRewards?.some((reward) => reward.canSelect))
  );
}

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white px-3.5 py-3 shadow-sm">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ScanCustomerConfirmDialog({
  preview,
  confirming,
  showPreviousRedemptions,
  onTogglePreviousRedemptions,
  onConfirm,
  onDismiss,
}: ScanCustomerConfirmDialogProps) {
  const redeemEnabled = canEnableRedeem(preview);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/55 p-3 backdrop-blur-sm sm:p-4"
      role="presentation"
      onClick={onDismiss}
    >
      <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-customer-title"
          className="flex max-h-[min(92dvh,820px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.45)]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* --- Header --- */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-5 pb-5 pt-5 text-white sm:px-6 sm:pb-6 sm:pt-6">
            <div
              className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-blue-400/20 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 left-8 size-32 rounded-full bg-violet-400/15 blur-2xl"
              aria-hidden
            />

            <div className="relative flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-bold tracking-wide shadow-inner">
                {customerInitials(preview.customerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
                  <ScanLine className="size-3.5" aria-hidden />
                  Guest verified
                </p>
                <h2
                  id="scan-customer-title"
                  className="mt-1 truncate text-xl font-bold tracking-tight sm:text-2xl"
                >
                  {preview.customerName}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-300">
                  {preview.customerEmail}
                </p>
              </div>
            </div>

            <div className="relative mt-4">
              <ScanStatusBadges
                paymentStatus={preview.paymentStatus}
                couponStatus={preview.couponStatus}
                couponExpired={preview.couponExpired}
              />
            </div>
          </div>

          {/* --- Scrollable body --- */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:space-y-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50/50 px-4 py-3 text-center ring-1 ring-blue-100/80">
                <p className="text-3xl font-bold tabular-nums text-zinc-900">
                  {preview.totalVisits}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-500">
                  Previous visits
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50/50 px-4 py-3 text-center ring-1 ring-violet-100/80">
                <p className="text-3xl font-bold tabular-nums text-zinc-900">
                  {preview.rewardsAvailable}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-500">
                  Available rewards
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <InfoRow
                icon={Mail}
                label="Email"
                value={preview.customerEmail}
              />
              <InfoRow
                icon={Megaphone}
                label="Campaign"
                value={preview.campaignName}
              />
              <InfoRow
                icon={CalendarClock}
                label="Expiry"
                value={
                  preview.coupon.expiresAt
                    ? formatDateTimeShort(preview.coupon.expiresAt)
                    : "No expiry"
                }
              />
            </div>

            {preview.availableRewards.length > 0 ? (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-900">
                  <Gift className="size-4 text-violet-600" aria-hidden />
                  Eligible rewards
                </p>
                <ul className="space-y-2">
                  {preview.availableRewards.map((reward) => (
                    <li
                      key={reward.couponId}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                        reward.canSelect
                          ? "border-violet-200 bg-white font-medium text-zinc-900"
                          : "border-zinc-200 bg-zinc-100/80 text-zinc-400"
                      }`}
                    >
                      <span className="min-w-0 truncate">{reward.label}</span>
                      {reward.isScannedCoupon ? (
                        <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Scanned
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview.previouslyRedeemedCount > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <button
                  type="button"
                  onClick={onTogglePreviousRedemptions}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <History className="size-4 text-zinc-500" aria-hidden />
                    {preview.previouslyRedeemedCount} previously redeemed reward
                    {preview.previouslyRedeemedCount === 1 ? "" : "s"}
                  </span>
                  {showPreviousRedemptions ? (
                    <ChevronUp className="size-4 text-zinc-500" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4 text-zinc-500" aria-hidden />
                  )}
                </button>
                {showPreviousRedemptions ? (
                  <ul className="space-y-2 border-t border-zinc-100 px-4 py-3">
                    {preview.previousRedemptions.map((item, index) => (
                      <li
                        key={`${item.campaignName}-${item.redeemedAt}-${index}`}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-zinc-900">
                          {item.campaignName}
                        </span>
                        {item.redeemedAt ? (
                          <span className="text-xs text-zinc-500">
                            {formatDateTimeShort(item.redeemedAt)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* --- Sticky footer --- */}
          <div className="shrink-0 border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 sm:text-base">
              <UserRound className="size-4 shrink-0 text-blue-600" aria-hidden />
              Are they redeeming an offer/reward today?
            </p>

            {preview.redeemBlockedReason ? (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />
                <p>{preview.redeemBlockedReason}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Confirm only if the guest is redeeming a prepaid reward right now.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onDismiss}
                disabled={confirming}
                className="min-w-24 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 sm:min-w-28"
              >
                No
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirming || !redeemEnabled}
                className="min-w-24 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:from-zinc-300 disabled:to-zinc-300 disabled:shadow-none sm:min-w-28"
              >
                {confirming ? "Processing…" : "Yes, redeem"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
