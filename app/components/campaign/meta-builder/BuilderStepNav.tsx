"use client";

import { Check } from "lucide-react";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
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
      className="shrink-0 border-b border-[#e8edf5] bg-white"
      aria-label="Campaign builder progress"
    >
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#f4f8ff] shadow-[0_4px_12px_rgba(24,119,242,0.1)]">
              <MetaLogo className="size-5" />
            </span>
            <p className="text-sm font-extrabold text-[#07111f]">Create Meta campaign</p>
          </div>
          <p className="shrink-0 text-xs font-bold tabular-nums text-[#1877f2]">
            {Math.round(progressPercent)}% complete
          </p>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]">
          <div
            className="h-full rounded-full bg-[#1877f2] transition-all duration-500 ease-out"
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
                      ? "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.32)]"
                      : isClickable
                        ? "cursor-pointer bg-[#f4f8ff] text-[#1877f2] hover:bg-[#e8f2ff]"
                        : "cursor-default text-slate-400"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-white/20 text-white"
                          : isReachable
                            ? "bg-[#dbeafe] text-[#1877f2]"
                            : "bg-[#f1f5f9] text-slate-400"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="hidden text-center text-[11px] font-bold leading-tight sm:block sm:text-left sm:text-xs">
                    {STEP_SHORT[step.id] ?? step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-3 text-center text-xs font-medium text-slate-500 sm:hidden">
          Step {currentStep}: {BUILDER_STEPS[currentStep - 1]?.label}
        </p>
      </div>
    </header>
  );
}
