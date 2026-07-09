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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const preselected = rewards
      .filter((reward) => reward.isScannedCoupon && reward.canSelect)
      .map((reward) => reward.couponId);

    if (preselected.length > 0) {
      setSelectedIds(preselected);
      return;
    }

    const firstSelectable = rewards.find((reward) => reward.canSelect);
    setSelectedIds(firstSelectable ? [firstSelectable.couponId] : []);
  }, [rewards]);

  const toggleReward = (reward: RedeemableReward) => {
    if (!reward.canSelect || confirming) return;

    setSelectedIds((current) =>
      current.includes(reward.couponId)
        ? current.filter((id) => id !== reward.couponId)
        : [...current, reward.couponId],
    );
  };

  const selectableCount = rewards.filter((reward) => reward.canSelect).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-reward-select-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="scan-reward-select-title"
          className="text-2xl font-semibold tracking-tight text-zinc-900"
        >
          Select the reward(s) they are redeeming now:
        </h2>

        <p className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-600">
          <Info className="size-4 shrink-0" aria-hidden />
          Click a reward again to deselect it.
        </p>

        <ul className="mt-5 space-y-3">
          {rewards.length === 0 ? (
            <li className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              No active rewards found for this guest.
            </li>
          ) : (
            rewards.map((reward) => {
              const checked = selectedIds.includes(reward.couponId);
              const disabled = !reward.canSelect;

              return (
                <li key={reward.couponId}>
                  <button
                    type="button"
                    disabled={disabled || confirming}
                    onClick={() => toggleReward(reward)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      checked
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">
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
            className="min-w-24 rounded-lg border border-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length === 0 || confirming}
            className="rounded-lg bg-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-600 enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed"
          >
            {confirming ? "Redeeming…" : "Select rewards to redeem"}
          </button>
        </div>
      </div>
    </div>
  );
}
