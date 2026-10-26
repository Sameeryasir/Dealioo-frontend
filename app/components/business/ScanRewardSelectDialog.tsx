"use client";

import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { RedeemableReward } from "@/app/services/redemption/scan-redemption";

type ScanRewardSelectDialogProps = {
  rewards: RedeemableReward[];
  confirming: boolean;
  onBack: () => void;
  onConfirm: (couponIds: number[]) => void;
  onDismiss: () => void;
};

export function ScanRewardSelectDialog({
  rewards,
  confirming,
  onBack,
  onConfirm,
  onDismiss,
}: ScanRewardSelectDialogProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const preselected = rewards.find(
      (reward) => reward.isScannedCoupon && reward.canSelect,
    );
    if (preselected) {
      setSelectedId(preselected.couponId);
      return;
    }

    const firstSelectable = rewards.find((reward) => reward.canSelect);
    setSelectedId(firstSelectable ? firstSelectable.couponId : null);
  }, [rewards]);

  const selectReward = (reward: RedeemableReward) => {
    if (!reward.canSelect || confirming) return;
    setSelectedId((current) =>
      current === reward.couponId ? null : reward.couponId,
    );
  };

  const selectableCount = rewards.filter((reward) => reward.canSelect).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e182b]/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-reward-select-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_24px_64px_rgba(14,24,43,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#eef2f7] bg-[#f8fafc] px-6 py-5">
          <h2
            id="scan-reward-select-title"
            className="text-xl font-extrabold tracking-tight text-[#0e182b]"
          >
            Select the reward they are redeeming now
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
            <Info className="size-4 shrink-0 text-[#1777f2]" aria-hidden />
            Redeem one guest deal at a time.
          </p>
        </div>
        <div className="px-6 py-5">

          <ul className="space-y-3">
            {rewards.length === 0 ? (
              <li className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-slate-600">
                No active rewards found for this guest.
              </li>
            ) : (
              rewards.map((reward) => {
                const checked = selectedId === reward.couponId;
                const disabled = !reward.canSelect;

                return (
                  <li key={reward.couponId}>
                    <button
                      type="button"
                      disabled={disabled || confirming}
                      onClick={() => selectReward(reward)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        checked
                          ? "border-[#1777f2] bg-[#e8f1ff]"
                          : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
                      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          checked
                            ? "border-[#1777f2] bg-[#1777f2] text-white"
                            : "border-[#e2e8f0] bg-white"
                        }`}
                        aria-hidden
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="text-sm font-medium text-[#0e182b]">
                        {reward.label}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {selectableCount === 0 && rewards.length > 0 ? (
            <p className="mt-3 text-sm text-red-600">
              No rewards are available to redeem right now.
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={confirming}
              className="min-w-24 rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-sm font-bold text-[#0e182b] hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                selectedId != null ? onConfirm([selectedId]) : undefined
              }
              disabled={selectedId == null || confirming}
              className="rounded-xl bg-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-600 enabled:bg-[#1777f2] enabled:text-white enabled:hover:bg-[#1569e0] disabled:cursor-not-allowed"
            >
              {confirming ? "Redeeming…" : "Redeem deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
