"use client";

import { Check } from "lucide-react";
import { BUILDER_STEPS } from "@/app/lib/meta-campaign-builder-types";

type BuilderStepNavProps = {
  currentStep: number;
  maxReachableStep: number;
  onStepClick: (stepId: number) => void;
};

export function BuilderStepNav({
  currentStep,
  maxReachableStep,
  onStepClick,
}: BuilderStepNavProps) {
  const progressPercent =
    ((currentStep - 1) / (BUILDER_STEPS.length - 1)) * 100;

  return (
    <nav
      aria-label="Campaign builder steps"
      className="border-b border-zinc-200 bg-white shadow-sm"
    >
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1877F2] to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPercent, 8)}%` }}
          />
        </div>

        <ol className="flex items-center gap-1 overflow-x-auto sm:gap-0">
          {BUILDER_STEPS.map((step, index) => {
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isReachable = step.id <= maxReachableStep;
            const isClickable = isReachable && !isCurrent;

            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-all sm:px-3 ${
                    isCurrent
                      ? "bg-[#1877F2]/10 shadow-[inset_0_0_0_1px_rgba(24,119,242,0.15)]"
                      : isClickable
                        ? "cursor-pointer hover:bg-zinc-50"
                        : "cursor-default opacity-50"
                  }`}
                >
                  <span
                    className={`relative flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isComplete
                        ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                        : isCurrent
                          ? "bg-[#1877F2] text-white shadow-[0_2px_8px_rgba(24,119,242,0.4)] ring-4 ring-[#1877F2]/20"
                          : isReachable
                            ? "bg-zinc-200 text-zinc-700"
                            : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-4" aria-hidden strokeWidth={2.5} />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span
                    className={`hidden truncate text-sm font-semibold sm:block ${
                      isCurrent
                        ? "text-[#1877F2]"
                        : isReachable
                          ? "text-zinc-700"
                          : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {index < BUILDER_STEPS.length - 1 ? (
                  <div
                    className={`mx-1 hidden h-0.5 flex-1 rounded-full sm:block ${
                      isComplete
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                        : "bg-zinc-200"
                    }`}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-center text-xs font-medium text-zinc-500 sm:hidden">
          Step {currentStep}: {BUILDER_STEPS[currentStep - 1]?.label}
        </p>
      </div>
    </nav>
  );
}
