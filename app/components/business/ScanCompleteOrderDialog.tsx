"use client";

import type { RedeemableReward } from "@/app/services/redemption/scan-redemption";

type ScanCompleteOrderDialogProps = {
  customerName: string;
  selectedRewards: RedeemableReward[];
  confirming: boolean;
  onBack: () => void;
  onContinue: () => void;
  onDismiss: () => void;
};

function getOfferName(reward: RedeemableReward): string {
  return reward.label.replace(/\s*\[(PREPAID|UNPAID)\]$/, "").trim();
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
  const rewardLabel =
    rewardCount === 1
      ? "Redeeming 1 reward"
      : `Redeeming ${rewardCount} rewards`;

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
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="scan-complete-order-title"
          className="text-2xl font-semibold tracking-tight text-zinc-900"
        >
          {customerName}
        </h2>

        <p className="mt-2 text-sm font-medium text-emerald-600">{rewardLabel}</p>

        <div className="my-6 border-t border-zinc-200" />

        <p className="text-base font-semibold text-zinc-900">
          Now, complete the guest&apos;s order:
        </p>

        <div className="mt-4 space-y-5">
          {selectedRewards.map((reward) => {
            const offerName = getOfferName(reward);
            const isPrepaid = reward.paymentLabel === "PREPAID";

            return (
              <div key={reward.couponId} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-zinc-700">
                    Reward:{" "}
                    <span className="font-semibold text-zinc-900">{offerName}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${
                      isPrepaid ? "bg-emerald-600" : "bg-zinc-500"
                    }`}
                  >
                    {reward.paymentLabel}
                  </span>
                </div>

                <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-800">
                  <li>
                    Add{" "}
                    <span className="font-medium underline decoration-zinc-400 underline-offset-2">
                      {offerName}
                    </span>{" "}
                    to their order.
                  </li>
                  {isPrepaid ? (
                    <li>
                      Apply a <span className="font-bold">100% discount</span> to
                      the item. They have already paid for it.
                    </li>
                  ) : (
                    <li>Collect payment for this item at checkout.</li>
                  )}
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
            className="min-w-24 rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={confirming}
            className="min-w-28 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {confirming ? "Redeeming…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
