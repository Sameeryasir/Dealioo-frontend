"use client";

import { AlertTriangle, CreditCard, MoreVertical } from "lucide-react";

export type GoogleAdsConversionGoalObjective =
  | "Sales"
  | "Leads"
  | "Website traffic";

type GoogleAdsConversionGoalsProps = {
  objectiveLabel: GoogleAdsConversionGoalObjective;
  showAddGoal?: boolean;
  onCancel: () => void;
  onContinue: () => void;
};

export function GoogleAdsConversionGoals({
  objectiveLabel,
  showAddGoal = false,
  onCancel,
  onContinue,
}: GoogleAdsConversionGoalsProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">
          <section className="rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">
            <h1 className="text-xl font-light tracking-tight text-[#202124] sm:text-2xl">
              Use these conversion goals to improve {objectiveLabel}.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5f6368]">
              Conversion goals labeled as account default will use data from all
              of your campaigns to improve your bid strategy and campaign
              performance, even if they don&apos;t seem directly related to{" "}
              {objectiveLabel}.
            </p>

            <div className="mt-8 overflow-x-auto">
              <div className="min-w-[36rem]">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-3 border-b border-[#dadce0] px-3 pb-2 text-xs font-light text-[#5f6368]">
                  <span>Conversion Goals</span>
                  <span>Conversion Source</span>
                  <span>Conversion Actions</span>
                  <span className="sr-only">More</span>
                </div>

                <div className="mt-3 rounded-lg border border-[#dadce0] bg-white">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-3 px-3 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f1f3f4] text-[#5f6368]">
                        <CreditCard className="size-4" aria-hidden />
                      </span>
                      <p className="truncate text-sm text-[#202124]">
                        <span className="font-light">Purchases</span>{" "}
                        <span className="text-[#5f6368]">(account default)</span>
                      </p>
                    </div>

                    <p className="text-sm text-[#202124]">Website</p>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-left text-sm text-[#202124]"
                    >
                      <AlertTriangle
                        className="size-4 shrink-0 text-[#e37400]"
                        aria-hidden
                      />
                      <span className="underline decoration-[#dadce0] underline-offset-2">
                        1 action
                      </span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-[#f1f3f4]"
                      aria-label="More options"
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showAddGoal ? (
              <button
                type="button"
                className="mt-5 cursor-pointer text-sm font-light text-[#1877f2] transition hover:underline"
              >
                Add goal
              </button>
            ) : null}
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-2 py-2 text-sm font-light text-[#1877f2] transition hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer rounded-md bg-[#1877f2] px-5 py-2.5 text-sm font-light text-white transition hover:bg-[#166fe0]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
