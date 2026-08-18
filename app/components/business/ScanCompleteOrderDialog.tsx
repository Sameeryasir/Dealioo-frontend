"use client";

import { Check, Gift, X } from "lucide-react";
import type { RedeemableReward } from "@/app/services/redemption/scan-redemption";

type ScanCompleteOrderDialogProps = {
  customerName: string;
  selectedRewards: RedeemableReward[];
  confirming: boolean;
  onBack: () => void;
  onContinue: () => void;
  onDismiss: () => void;
};

type DisplayPaymentLabel = "PREPAID" | "UNPAID" | "POSTPAID";

function getOfferName(reward: RedeemableReward): string {
  return reward.label.replace(/\s*\[(PREPAID|UNPAID|POSTPAID)\]$/, "").trim();
}

function getDisplayPaymentLabel(reward: RedeemableReward): DisplayPaymentLabel {
  if (reward.paymentLabel === "PREPAID") return "PREPAID";
  if (reward.campaignType === "postpaid") return "POSTPAID";
  return "UNPAID";
}

function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "G").toUpperCase();
}

function groupRewardsForInstructions(rewards: RedeemableReward[]) {
  const groups = new Map<
    string,
    {
      offerName: string;
      displayLabel: DisplayPaymentLabel;
      count: number;
    }
  >();

  for (const reward of rewards) {
    const offerName = getOfferName(reward);
    const displayLabel = getDisplayPaymentLabel(reward);
    const key = `${offerName.toLowerCase()}::${displayLabel}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    groups.set(key, {
      offerName,
      displayLabel,
      count: 1,
    });
  }

  return Array.from(groups.values());
}

export function ScanCompleteOrderDialog({
  customerName,
  selectedRewards,
  confirming,
  onBack,
  onContinue,
  onDismiss,
}: ScanCompleteOrderDialogProps) {
  const rewardCount = selectedRewards.length;
  const instructionGroups = groupRewardsForInstructions(selectedRewards);
  const initials = guestInitials(customerName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-complete-order-title"
        className="flex max-h-[90vh] w-full max-w-[32rem] flex-col rounded-2xl bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-sm font-semibold text-[#137333]"
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h2
                id="scan-complete-order-title"
                className="truncate text-[17px] font-bold leading-tight text-zinc-900"
              >
                {customerName}
              </h2>
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[12px] font-medium text-[#137333]">
                <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                Redeeming {rewardCount} {rewardCount === 1 ? "reward" : "rewards"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 border-t border-zinc-200" />

        <p className="mt-5 text-[17px] font-semibold text-zinc-900">
          Now, complete the guest&apos;s order:
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto">
          {instructionGroups.map((group, groupIndex) => {
            const isPrepaid = group.displayLabel === "PREPAID";
            const isPostpaid = group.displayLabel === "POSTPAID";
            const stepBase = groupIndex * 2 + 1;
            const itemWord = group.count > 1 ? "the items" : "the item";
            const paidWord = group.count > 1 ? "them" : "it";

            return (
              <div key={`${group.offerName}::${group.displayLabel}`}>
                <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-[#f7f7f7] px-3.5 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[#137333]">
                    <Gift className="size-4" aria-hidden />
                  </span>
                  <p className="min-w-0 flex-1 text-[14px] text-zinc-800">
                    Reward:{" "}
                    <span className="font-semibold">{group.offerName}</span>
                    {group.count > 1 ? (
                      <span className="ml-1 font-semibold text-zinc-500">
                        ×{group.count}
                      </span>
                    ) : null}
                  </p>
                  <span
                    className={
                      isPrepaid
                        ? "shrink-0 rounded-full bg-[#1e8e3e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        : "shrink-0 rounded-full bg-zinc-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    }
                  >
                    {group.displayLabel}
                  </span>
                </div>

                <ol className="mt-1">
                  <li>
                    <div className="flex items-start gap-3 py-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[13px] font-semibold text-[#137333]">
                        {stepBase}
                      </span>
                      <p className="pt-0.5 text-[14px] leading-5 text-zinc-800">
                        Add <span className="font-semibold">{group.offerName}</span>
                        {group.count > 1 ? ` (×${group.count})` : ""} to their
                        order.
                      </p>
                    </div>
                    <div className="border-t border-zinc-200" />
                  </li>
                  <li>
                    <div className="flex items-start gap-3 py-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[13px] font-semibold text-[#137333]">
                        {stepBase + 1}
                      </span>
                      <p className="pt-0.5 text-[14px] leading-5 text-zinc-800">
                        {isPrepaid ? (
                          <>
                            Apply a{" "}
                            <span className="font-semibold">100% discount</span>{" "}
                            to {itemWord}. They have already paid for {paidWord}.
                          </>
                        ) : isPostpaid ? (
                          <>
                            Collect the{" "}
                            <span className="font-semibold">offer amount</span>{" "}
                            at checkout. They pay at the location.
                          </>
                        ) : (
                          <>
                            Collect payment for{" "}
                            {group.count > 1 ? "these items" : "this item"} at
                            checkout.
                          </>
                        )}
                      </p>
                    </div>
                    {groupIndex < instructionGroups.length - 1 ? (
                      <div className="border-t border-zinc-200" />
                    ) : null}
                  </li>
                </ol>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={confirming}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={confirming}
            className="rounded-lg bg-[#1877f2] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe0] disabled:opacity-50"
          >
            {confirming ? "Redeeming…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
