"use client";

import { Check } from "lucide-react";
import { BUILDER_STEPS } from "@/app/lib/meta-campaign-builder-types";

type BuilderStepNavProps = {
  currentStep: number;
  maxReachableStep: number;
  onStepClick: (stepId: number) => void;
};

const STEP_SHORT: Record<number, string> = {
  1: "Campaign",
  2: "Ad set",
  3: "Creative",
  4: "Publish",
};

export function BuilderStepNav({
  currentStep,
  maxReachableStep,
  onStepClick,
}: BuilderStepNavProps) {
  const progressPercent =
    ((currentStep - 1) / (BUILDER_STEPS.length - 1)) * 100;

  return (
    <header
      className="shrink-0 border-b border-zinc-200 bg-white"
      aria-label="Campaign builder progress"
    >
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-zinc-900">Create Meta campaign</p>
          <p className="text-xs font-medium text-zinc-500">
            {Math.round(progressPercent)}% complete
          </p>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, 6)}%` }}
          />
        </div>

        <ol className="grid grid-cols-4 gap-1 sm:gap-2">
          {BUILDER_STEPS.map((step) => {
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isReachable = step.id <= maxReachableStep;
            const isClickable = isReachable && !isCurrent;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full flex-col items-center gap-2 rounded-xl px-2 py-2.5 transition sm:flex-row sm:items-center sm:px-3 ${
                    isCurrent
                      ? "bg-zinc-900 text-white shadow-sm"
                      : isClickable
                        ? "cursor-pointer bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                        : "cursor-default text-zinc-400"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-white/20 text-white"
                          : isReachable
                            ? "bg-zinc-200 text-zinc-700"
                            : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="hidden text-center text-[11px] font-semibold leading-tight sm:block sm:text-left sm:text-xs">
                    {STEP_SHORT[step.id] ?? step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-center text-xs text-zinc-500 sm:hidden">
          Step {currentStep}: {BUILDER_STEPS[currentStep - 1]?.label}
        </p>
      </div>
    </header>
  );
}
