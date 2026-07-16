"use client";

import { SignupSelectPlanPanel } from "@/app/components/SignupSelectPlanPanel";

export default function UpgradePlanPage() {
  return (
    <div className="auth-select-plan-page w-full">
      <main className="auth-select-plan-main px-4 py-8 sm:px-6 lg:px-8">
        <div className="auth-select-plan-header mx-auto max-w-3xl text-center">
          <h1 className="brand-landing-display auth-signup-step-title">
            Upgrade your{" "}
            <span className="landing-hero-accent-blue">plan</span>
          </h1>
          <p className="auth-signup-step-sub mt-1.5">
            Pick the plan that fits your business. You can change it later.
          </p>
        </div>

        <SignupSelectPlanPanel mode="upgrade" />
      </main>
    </div>
  );
}
