"use client";

import {
  findPricingPlan,
  getPlanTier,
  PRICING_PLANS,
  type BillingCycle,
  type PricingPlan,
} from "@/app/components/landing/pricing-plans";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useCallback, useMemo, useRef, type Ref } from "react";

type SignupPlanStepProps = {
  billing: BillingCycle;
  onBillingChange: (cycle: BillingCycle) => void;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  plans?: readonly PricingPlan[];
  /** Full-width select-plan page: all cards in one row, no scroll hint. */
  layout?: "signup" | "single-row";
};

function SignupPlanFeatures({ plan }: { plan: PricingPlan }) {
  if (plan.featureGroups?.length) {
    return (
      <div className="auth-signup-plan-feature-groups space-y-1.5">
        {plan.featureGroups.map((group) => (
          <div key={group.label}>
            <p className="auth-signup-plan-feature-group-label mb-0.5 font-bold uppercase tracking-[0.1em] text-brand-muted">
              {group.label}
            </p>
            <ul className="auth-signup-plan-features space-y-1">
              {group.items.map((feature) => (
                <li
                  key={feature}
                  className="auth-signup-plan-feature-item flex items-start gap-1 text-brand-body"
                >
                  <Check className="auth-signup-plan-feature-check mt-0.5 shrink-0 text-brand-retain" strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="auth-signup-plan-features space-y-1">
      {(plan.features ?? []).map((feature) => (
        <li
          key={feature}
          className="auth-signup-plan-feature-item flex items-start gap-1 text-brand-body"
        >
          <Check className="auth-signup-plan-feature-check mt-0.5 shrink-0 text-brand-retain" strokeWidth={3} />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className="auth-signup-plan-billing-toggle inline-flex rounded-full bg-[#eef2f8] p-0.5"
      role="radiogroup"
      aria-label="Billing cycle"
    >
      {(["monthly", "annual"] as const).map((value) => {
        const selected = cycle === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(value)}
            className={`relative rounded-full px-3 py-1 text-[11px] font-bold capitalize transition sm:px-3.5 sm:text-xs ${
              selected ? "text-white" : "text-brand-muted hover:text-brand-navy"
            }`}
          >
            {selected && !reduced ? (
              <motion.span
                layoutId="signup-billing-pill"
                className="absolute inset-0 rounded-full bg-brand-primary shadow-[0_4px_14px_rgba(24,119,242,0.28)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : selected ? (
              <span className="absolute inset-0 rounded-full bg-brand-primary shadow-[0_4px_14px_rgba(24,119,242,0.28)]" />
            ) : null}
            <span className="relative z-[1]">{value}</span>
          </button>
        );
      })}
    </div>
  );
}

function SignupPlanCard({
  plan,
  billing,
  selected,
  onSelect,
  cardRef,
}: {
  plan: PricingPlan;
  billing: BillingCycle;
  selected: boolean;
  onSelect: (planId: string) => void;
  cardRef?: Ref<HTMLButtonElement>;
}) {
  const tier = getPlanTier(plan, billing);

  return (
    <button
      ref={cardRef}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(plan.id)}
      className={`auth-signup-plan-card flex h-full w-full flex-col text-left transition ${
        selected
          ? "auth-signup-plan-card--selected border-brand-primary bg-[#f8faff] shadow-[0_0_0_1px_rgba(24,119,242,0.35)]"
          : "border-[#dbe3ef] bg-white hover:border-[#b8c9e4] hover:bg-[#fafbfd]"
      } ${plan.highlighted ? "auth-signup-plan-card--featured" : ""} ${
        plan.id === "growth-expert" ? "auth-signup-plan-card--expert" : ""
      }`}
    >
      <div className="auth-signup-plan-card-top flex items-start justify-between gap-1">
        <div className="flex min-h-[0.875rem] flex-wrap items-center gap-0.5">
          {plan.badge ? (
            <span
              className={`auth-signup-plan-card-badge inline-flex max-w-full rounded-full font-bold leading-tight tracking-wide ${
                plan.highlighted
                  ? "uppercase text-white"
                  : "border border-[#e8edf5] bg-[#f8faff] text-brand-navy"
              }`}
              style={plan.highlighted ? { backgroundColor: plan.color } : undefined}
            >
              {plan.badge}
            </span>
          ) : null}
        </div>
        <span
          className={`auth-signup-plan-card-radio flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 lg:h-4 lg:w-4 ${
            selected
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-[#cbd5e1] bg-white"
          }`}
          aria-hidden
        >
          {selected ? (
            <Check className="h-2 w-2 lg:h-2.5 lg:w-2.5" strokeWidth={3} />
          ) : null}
        </span>
      </div>

      <div className="auth-signup-plan-card-main mt-1">
        <h3 className="auth-signup-plan-card-name font-extrabold leading-tight text-brand-navy">
          {plan.name}
        </h3>
        <p className="auth-signup-plan-card-tagline mt-0.5 leading-tight text-brand-muted lg:hidden">
          {plan.tagline}
        </p>

        <div className="auth-signup-plan-card-price mt-1 flex items-baseline gap-0.5 lg:mt-1.5">
          <span className="auth-signup-plan-card-price-value font-black tracking-tight text-brand-navy">
            {tier.price}
          </span>
          {tier.period ? (
            <span className="auth-signup-plan-card-price-period font-semibold text-brand-muted">
              {tier.period}
            </span>
          ) : null}
        </div>

        <p className="auth-signup-plan-card-subline mt-0.5 min-h-[0.75rem] font-medium leading-tight text-brand-muted">
          {tier.subline ?? "\u00A0"}
        </p>

        <p className="auth-signup-plan-card-desc mt-1 font-medium leading-tight text-brand-body lg:mt-1">
          {plan.description}
        </p>
      </div>

      <div className="auth-signup-plan-card-features-wrap mt-1 lg:mt-1.5">
        <SignupPlanFeatures plan={plan} />
      </div>
    </button>
  );
}

function SignupPlanMoreHint({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="auth-signup-plan-more-hint"
      onClick={onClick}
      aria-label={`Click to see ${count} more plans`}
    >
      <span className="auth-signup-plan-more-hint-pill">
        <ChevronDown className="auth-signup-plan-more-hint-icon" strokeWidth={2.5} />
        <span className="auth-signup-plan-more-hint-text">Click to see more</span>
      </span>
    </button>
  );
}

export function SignupPlanStep({
  billing,
  onBillingChange,
  selectedPlanId,
  onSelectPlan,
  plans = PRICING_PLANS,
  layout = "signup",
}: SignupPlanStepProps) {
  const singleRow = layout === "single-row";
  const billingNote = useMemo(
    () =>
      billing === "annual"
        ? "Prices per month, billed annually · Save 17%"
        : "Flexible monthly billing",
    [billing],
  );

  const topRowPlans = plans.slice(0, 2);
  const bottomRowPlans = plans.slice(2);
  const firstBottomPlanRef = useRef<HTMLButtonElement>(null);

  const scrollToBottomPlans = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const target = firstBottomPlanRef.current;
    if (!target) {
      return;
    }

    const scrollContainer = target.closest(".auth-signup-scroll-block--plan-step");
    if (scrollContainer instanceof HTMLElement) {
      const top =
        target.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop -
        16;

      scrollContainer.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }, []);

  return (
    <div
      className={`auth-signup-plan-step flex w-full flex-col${
        singleRow ? " auth-signup-plan-step--single-row" : ""
      }`}
    >
      <div className="auth-signup-plan-billing-wrap flex shrink-0 items-center justify-between gap-2 pb-2">
        <BillingToggle cycle={billing} onChange={onBillingChange} />
        <p className="auth-signup-plan-billing-note text-right text-[10px] font-semibold leading-tight text-brand-muted sm:text-[11px]">
          {billingNote}
        </p>
      </div>

      <div className="auth-signup-plan-list-wrap">
        <div className="auth-signup-plan-list-scroll">
          <div className="auth-signup-plan-card-shell">
            <div className="auth-signup-plan-list" role="radiogroup" aria-label="Choose a plan">
              {singleRow
                ? plans.map((plan) => (
                    <SignupPlanCard
                      key={plan.id}
                      plan={plan}
                      billing={billing}
                      selected={selectedPlanId === plan.id}
                      onSelect={onSelectPlan}
                    />
                  ))
                : (
                  <>
                    {topRowPlans.map((plan) => (
                      <SignupPlanCard
                        key={plan.id}
                        plan={plan}
                        billing={billing}
                        selected={selectedPlanId === plan.id}
                        onSelect={onSelectPlan}
                      />
                    ))}

                    <SignupPlanMoreHint
                      count={bottomRowPlans.length}
                      onClick={scrollToBottomPlans}
                    />

                    {bottomRowPlans.map((plan, index) => (
                      <SignupPlanCard
                        key={plan.id}
                        cardRef={index === 0 ? firstBottomPlanRef : undefined}
                        plan={plan}
                        billing={billing}
                        selected={selectedPlanId === plan.id}
                        onSelect={onSelectPlan}
                      />
                    ))}
                  </>
                )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export function getSignupPlanCta(
  planId: string,
  plans?: readonly PricingPlan[],
): string {
  const fromList = plans?.find((plan) => plan.id === planId);
  if (fromList?.cta) return fromList.cta;
  return findPricingPlan(planId)?.cta ?? "Continue";
}
