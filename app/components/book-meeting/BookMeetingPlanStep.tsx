"use client";

import {
  getPlanTier,
  type BillingCycle,
} from "@/app/components/landing/pricing-plans";
import { useSubscriptionPlans } from "@/app/hooks/use-subscription-plans";
import { Check, Loader2 } from "lucide-react";
import { useMemo } from "react";
import styles from "./BookMeetingForm.module.css";

const BOOK_MEETING_PLAN_IDS = ["growth-expert", "enterprise"] as const;

export type BookMeetingPlanStepProps = {
  selectedPlanSlug: string;
  selectedBillingCycle: "" | BillingCycle;
  onChange: (patch: {
    selectedPlanSlug?: string;
    selectedPlanName?: string;
    selectedBillingCycle?: BillingCycle;
  }) => void;
};

export function BookMeetingPlanStep({
  selectedPlanSlug,
  selectedBillingCycle,
  onChange,
}: BookMeetingPlanStepProps) {
  const { plans, loading } = useSubscriptionPlans();
  const billing: BillingCycle =
    selectedBillingCycle === "monthly" || selectedBillingCycle === "annual"
      ? selectedBillingCycle
      : "monthly";

  const visiblePlans = useMemo(() => {
    const allowed = new Set<string>(BOOK_MEETING_PLAN_IDS);
    const filtered = plans.filter((plan) => allowed.has(plan.id));
    return [...filtered].sort(
      (a, b) =>
        BOOK_MEETING_PLAN_IDS.indexOf(
          a.id as (typeof BOOK_MEETING_PLAN_IDS)[number],
        ) -
        BOOK_MEETING_PLAN_IDS.indexOf(
          b.id as (typeof BOOK_MEETING_PLAN_IDS)[number],
        ),
    );
  }, [plans]);

  if (loading && visiblePlans.length === 0) {
    return (
      <div className={styles.planLoading} role="status" aria-live="polite">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>Loading plans…</span>
      </div>
    );
  }

  return (
    <div className={styles.planStep}>
      <div
        className={styles.planBillingToggle}
        role="group"
        aria-label="Billing cycle"
      >
        <button
          type="button"
          className={`${styles.planBillingBtn}${billing === "monthly" ? ` ${styles.planBillingBtnSelected}` : ""}`}
          aria-pressed={billing === "monthly"}
          onClick={() => onChange({ selectedBillingCycle: "monthly" })}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`${styles.planBillingBtn}${billing === "annual" ? ` ${styles.planBillingBtnSelected}` : ""}`}
          aria-pressed={billing === "annual"}
          onClick={() => onChange({ selectedBillingCycle: "annual" })}
        >
          Annually
        </button>
      </div>

      <div className={styles.choiceList} role="listbox" aria-label="Choose a plan">
        {visiblePlans.map((plan) => {
          const selected = selectedPlanSlug === plan.id;
          const tier = getPlanTier(plan, billing);
          const priceLabel = [tier.price, tier.period].filter(Boolean).join(" ");

          return (
            <button
              key={plan.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`${styles.choiceListItem}${selected ? ` ${styles.choiceListItemSelected}` : ""}`}
              onClick={() =>
                onChange({
                  selectedPlanSlug: plan.id,
                  selectedPlanName: plan.name,
                  selectedBillingCycle: billing,
                })
              }
            >
              <span className={styles.planChoiceCopy}>
                <span className={styles.choiceListLabel}>{plan.name}</span>
                <span className={styles.planChoiceMeta}>
                  {priceLabel}
                  {plan.tagline ? ` · ${plan.tagline}` : ""}
                </span>
              </span>
              {selected ? (
                <span className={styles.choiceListMark} aria-hidden>
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
