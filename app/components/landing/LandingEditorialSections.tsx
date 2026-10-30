"use client";

import { appendBillingQuery } from "@/app/lib/billing-cycle";
import { landingSignupHref } from "@/app/components/landing/landing-auth";
import {
  getPlanTier,
  type BillingCycle,
  type PricingPlan,
} from "@/app/components/landing/pricing-plans";
import { useSubscriptionPlans } from "@/app/hooks/use-subscription-plans";
import { Reveal } from "@/app/components/landing/LandingMotionParts";
import { BRAND_COLORS } from "@/app/components/landing/landing-brand";
import { easeOut } from "@/app/components/landing/landing-motion";
import { trackProductButtonClick, trackProductLead } from "@/app/lib/product-meta-pixel";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  Crown,
  Loader2,
  MousePointerClick,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";

const PRODUCT_CAPABILITIES = [
  {
    title: "Branded deal funnels",
    body: "Landing pages, signup and checkout that match your brand.",
    Icon: MousePointerClick,
    color: BRAND_COLORS.blue,
  },
  {
    title: "Payments and QR",
    body: "Stripe checkout upfront and scan-to-redeem at the door.",
    Icon: CreditCard,
    color: BRAND_COLORS.orange,
  },
  {
    title: "Live guest tracking",
    body: "Signups, revenue and redemptions update in one dashboard.",
    Icon: BarChart3,
    color: BRAND_COLORS.pink,
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "28% of my revenue comes from guests who found us through a Dealioo funnel.",
    name: "Noah L.",
    role: "Business owner",
    color: BRAND_COLORS.blue,
  },
  {
    quote: "We see who clicked, paid and walked through the door, not just form fills.",
    name: "Victoria M.",
    role: "Retail operator",
    color: BRAND_COLORS.pink,
  },
  {
    quote: "One weekend deal drove 31% more revenue with zero extra ad spend.",
    name: "Tami D.",
    role: "Multi-location brand",
    color: BRAND_COLORS.green,
  },
  {
    quote: "We went from 2% traffic conversion to 5.4% with a tracked prepaid offer.",
    name: "Tyler M.",
    role: "Quick-service operator",
    color: BRAND_COLORS.orange,
  },
] as const;

const PROOF_STATS = [
  { value: "40%", label: "repeat visits", color: BRAND_COLORS.green },
  { value: "$64M+", label: "attributed", color: BRAND_COLORS.blue },
  { value: "5.4%", label: "conversion", color: BRAND_COLORS.pink },
] as const;

const CTA_CHIPS = [
  { value: "40%", label: "repeat visits", color: BRAND_COLORS.green, depth: 12 },
  { value: "5.4%", label: "conversion", color: BRAND_COLORS.pink, depth: 20 },
  { value: "$64M+", label: "attributed", color: BRAND_COLORS.blue, depth: 8 },
] as const;

const SPOTLIGHT_POINTING_SRC = "/pointing.png";

function PricingPlanFeatures({ plan }: { plan: PricingPlan }) {
  if ("featureGroups" in plan && plan.featureGroups) {
    return (
      <div className="landing-pricing-feature-groups mt-2 space-y-2">
        {plan.featureGroups.map((group) => (
          <div key={group.label}>
            <p className="landing-pricing-feature-group-label mb-1 inline-flex rounded-full bg-[#eef2ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#5b6b8c]">
              {group.label}
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-snug text-brand-navy marker:text-brand-muted">
              {group.items.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-snug text-brand-navy marker:text-brand-muted">
      {(plan.features ?? []).map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  );
}

function PricingCardGlow() {
  return (
    <>
      <span
        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-[#dbe7ff] opacity-70 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -left-10 top-20 size-28 rounded-full bg-[#eef0ff] opacity-60 blur-3xl"
        aria-hidden
      />
    </>
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
      className="landing-pricing-billing-toggle mx-auto mt-5 inline-flex rounded-full bg-[#eef2f8] p-1 sm:mt-6"
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
            className={`relative rounded-full px-4 py-2 text-xs font-bold capitalize transition sm:px-5 sm:text-sm ${
              selected ? "text-white" : "text-brand-muted hover:text-brand-navy"
            }`}
          >
            {selected && !reduced ? (
              <motion.span
                layoutId="billing-pill"
                className="absolute inset-0 rounded-full bg-brand-primary shadow-[0_4px_14px_rgba(24,119,242,0.28)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : selected ? (
              <span className="absolute inset-0 rounded-full bg-brand-primary shadow-[0_4px_14px_rgba(24,119,242,0.28)]" />
            ) : null}
            <span className="relative z-[1]">
              {value === "annual" ? "Yearly" : "Monthly"}
            </span>
            {value === "annual" && selected ? (
              <span className="relative ml-1.5 hidden text-[10px] font-bold uppercase tracking-wide text-white/90 sm:inline">
                Save 17%
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function LandingSpotlightBand() {
  const reduced = useReducedMotion();

  return (
    <section className="landing-spotlight-band" aria-label="Our philosophy">
      {!reduced ? (
        <>
          <div className="landing-spotlight-orb landing-spotlight-orb-a" aria-hidden />
          <div className="landing-spotlight-orb landing-spotlight-orb-b" aria-hidden />
        </>
      ) : null}

      <div className="brand-landing-section relative z-10">
        <div className="landing-spotlight-stage">
          <motion.div
            className="landing-spotlight-pointing-wrap"
            aria-hidden
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: 0.15, ease: easeOut }}
          >
            <motion.div
              className="landing-spotlight-pointing-float"
              animate={reduced ? undefined : { y: [0, -10, 0] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
            >
              <Image
                src={SPOTLIGHT_POINTING_SRC}
                alt=""
                width={512}
                height={512}
                className="landing-spotlight-pointing"
                sizes="(max-width: 767px) 168px, 264px"
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="landing-spotlight-frame-3d mx-auto"
            initial={reduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <span className="landing-spotlight-corner landing-spotlight-corner-tl" aria-hidden />
            <span className="landing-spotlight-corner landing-spotlight-corner-tr" aria-hidden />
            <span className="landing-spotlight-corner landing-spotlight-corner-bl" aria-hidden />
            <span className="landing-spotlight-corner landing-spotlight-corner-br" aria-hidden />
            <blockquote className="landing-spotlight-quote">
              <span className="landing-spotlight-quote-desktop hidden sm:block">
                <span className="landing-spotlight-quote-line landing-spotlight-quote-line-lead">
                  <span>Marketing shouldn&apos;t end with a click.</span>{" "}
                  <span className="landing-spotlight-quote-tail">It should end with a</span>
                </span>
                <span className="landing-spotlight-quote-line landing-spotlight-highlight">
                  returning customer.
                </span>
              </span>
              <span className="sm:hidden">
                Marketing shouldn&apos;t end with a click. It should end with a{" "}
                <span className="landing-spotlight-highlight">returning customer.</span>
              </span>
            </blockquote>
          </motion.div>

          <div className="landing-spotlight-captions">
            <motion.p
              className="landing-spotlight-tagline"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5, ease: easeOut }}
            >
              <span className="landing-spotlight-tagline-mobile sm:hidden">
                <span className="landing-spotlight-tagline-emphasis">
                  From the first click
                  <br />
                  to the next visit.
                </span>
              </span>
              <span className="hidden sm:inline">
                Dealioo helps local businesses track the complete customer journey,{" "}
                <span className="landing-spotlight-tagline-emphasis">
                  From the first click to the next visit.
                </span>
              </span>
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFinalCtaBand() {
  const reduced = useReducedMotion();
  const signupHref = landingSignupHref();

  return (
    <section
      id="get-started"
      className="landing-final-cta-band scroll-mt-16 md:scroll-mt-28"
      aria-label="Get started"
    >
      {!reduced ? (
        <div
          className="landing-final-cta-orb"
          style={{ top: "10%", right: "5%", width: 220, height: 220, background: "rgba(225,48,108,0.14)" }}
          aria-hidden
        />
      ) : null}

      <div className="brand-landing-section">
        <div className="landing-final-cta-grid">
          <motion.div
            className="landing-final-cta-chips"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
            }}
          >
            {CTA_CHIPS.map((chip) => (
              <motion.div
                key={chip.label}
                className="landing-final-cta-chip"
                variants={{
                  hidden: { opacity: 0, y: 24, rotateX: 18, scale: 0.92 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    scale: 1,
                    transition: { duration: 0.55, ease: easeOut },
                  },
                }}
                whileHover={
                  reduced
                    ? undefined
                    : {
                        y: -6,
                        rotateX: 6,
                        rotateY: chip.depth > 14 ? -4 : 4,
                        scale: 1.03,
                        transition: { type: "spring", stiffness: 320, damping: 22 },
                      }
                }
                animate={
                  reduced
                    ? undefined
                    : {
                        y: [0, -5, 0],
                        transition: {
                          duration: 4 + chip.depth * 0.08,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                }
                style={{ transformPerspective: 900 }}
              >
                <span className="landing-final-cta-chip-value" style={{ color: chip.color }}>
                  {chip.value}
                </span>
                <span className="landing-final-cta-chip-label">{chip.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <Reveal className="landing-final-cta-copy" y={32}>
            <p className="landing-final-cta-eyebrow">Ready to launch</p>
            <h2 className="landing-final-cta-headline">
              Turn ad clicks into{" "}
              <span className="landing-final-cta-accent-blue">paying guests</span> and bring them{" "}
              <span className="landing-final-cta-accent-pink">back</span>.
            </h2>
            <p className="landing-final-cta-sub mx-auto lg:mx-0">
              Start free with one campaign. Connect Stripe, publish your funnel and track every guest from
              ad click to QR scan.
            </p>
            <div className="landing-final-cta-actions">
              <motion.a
                href={signupHref}
                className="landing-final-cta-btn-primary"
                whileHover={reduced ? undefined : { scale: 1.03, y: -2 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                onClick={() => {
                  trackProductButtonClick("Start free in 60 seconds", "final_cta");
                  trackProductLead("signup_cta_final");
                }}
              >
                Start free in 60 seconds
                <ArrowRight className="h-4 w-4" aria-hidden />
              </motion.a>
              <motion.a
                href={signupHref}
                className="landing-final-cta-btn-ghost"
                whileHover={reduced ? undefined : { scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                onClick={() => {
                  trackProductButtonClick("Get started free", "final_cta");
                  trackProductLead("signup_cta_final");
                }}
              >
                Get started free
              </motion.a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function LandingIntroBand() {
  return null;
}

export function LandingTheProduct() {
  const reduced = useReducedMotion();

  return (
    <section id="features" className="landing-compact-section scroll-mt-16 bg-white md:scroll-mt-24" aria-label="The product">
      <div className="brand-landing-section">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="landing-section-eyebrow">
            <span className="text-brand-primary">The platform</span>
          </p>
          <h2 className="brand-landing-display mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl md:text-3xl">
            Ads, funnels, payments and QR, one connected loop
          </h2>
          <p className="mt-3 text-sm text-brand-body sm:text-base">
            Everything you need to prove which deals drive real visits and revenue.
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="landing-section-card-shell"
        >
          <div className="grid md:grid-cols-3 md:divide-x md:divide-[#e8edf5]">
            {PRODUCT_CAPABILITIES.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <motion.div whileHover={reduced ? undefined : { y: -2 }} className="landing-section-card-col">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <item.Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-brand-navy sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-body">{item.body}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
          <div className="landing-section-card-footer flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {["Meta and Google ads", "Guest CRM", "Automations", "ROI dashboards"].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-navy sm:text-sm"
                style={{ boxShadow: "0 0 0 1px #e8edf5" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingSocialProof() {
  return (
    <section className="landing-compact-section landing-compact-alt py-10 sm:py-12" aria-label="Results and testimonials">
      <div className="brand-landing-section w-full">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="landing-section-eyebrow">
            <span className="text-brand-retain">Results</span>
          </p>
          <h2 className="brand-landing-display mt-2 text-xl font-semibold sm:text-2xl md:text-3xl">
            Operators who track the full loop see the difference
          </h2>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="landing-section-card-shell !mt-5 sm:!mt-6"
        >
          <div className="grid grid-cols-3 divide-x divide-[#e8edf5] bg-[#f8faff] px-3 py-4 sm:px-6 sm:py-5">
            {PROOF_STATS.map((stat) => (
              <div key={stat.value} className="px-2 text-center">
                <p className="text-2xl font-black tracking-tight sm:text-3xl" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand-muted sm:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
            {TESTIMONIALS.map((t) => (
              <Reveal key={t.name}>
                <figure className="flex h-full flex-col rounded-xl bg-[#fafbfd] p-4">
                  <blockquote className="flex-1 text-sm leading-snug text-brand-body">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 border-t border-[#eef2f8] pt-3">
                    <p className="text-sm font-bold text-brand-navy">{t.name}</p>
                    <p className="text-xs text-brand-muted">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingTestimonials() {
  return <LandingSocialProof />;
}

export function LandingQuoteStat() {
  return null;
}

const LANDING_VISIBLE_PLAN_IDS = new Set(["growth-expert", "enterprise"]);

export function LandingPricing() {
  const reduced = useReducedMotion();
  const { plans, loading } = useSubscriptionPlans();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const signupHref = useMemo(
    () => appendBillingQuery(landingSignupHref(), billing),
    [billing],
  );
  const visiblePlans = useMemo(
    () =>
      plans
        .filter((plan) => LANDING_VISIBLE_PLAN_IDS.has(plan.id))
        .sort((a, b) => {
          const order = ["growth-expert", "enterprise"];
          return order.indexOf(a.id) - order.indexOf(b.id);
        }),
    [plans],
  );

  const footerNote = useMemo(
    () =>
      billing === "annual"
        ? "Save 17% with annual billing. Switch or cancel anytime."
        : "Switch to annual billing to save 17%. Cancel anytime.",
    [billing],
  );

  const billingNote = useMemo(
    () =>
      billing === "annual"
        ? "Prices shown per month, billed annually · Save 17%"
        : "Flexible monthly billing · Pay as you go",
    [billing],
  );

  return (
    <section id="pricing" className="landing-pricing-section scroll-mt-16 md:scroll-mt-24" aria-label="Pricing">
      <div className="brand-landing-section relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-section-eyebrow">Plans and pricing</p>
          <h2 className="brand-landing-display landing-section-heading">
            A plan for every stage of your{" "}
            <span className="landing-hero-accent-pink">growth.</span>
          </h2>
          <p className="landing-section-intro">
            Work with a dedicated marketing expert, or get a custom plan for your brand.
          </p>
        </Reveal>

        <div className="landing-pricing-billing-wrap flex justify-center">
          <BillingToggle cycle={billing} onChange={setBilling} />
        </div>
        <p className="landing-pricing-billing-note mx-auto mt-3 max-w-md text-center text-[11px] font-semibold text-brand-muted sm:mt-4 sm:text-xs">
          {billingNote}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="landing-pricing-card-shell mx-auto mt-5 w-full max-w-[52rem] sm:mt-6"
        >
          {loading ? (
            <div className="flex min-h-[20rem] items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
            </div>
          ) : (
          <div className="landing-pricing-grid grid gap-5 md:grid-cols-2 md:gap-6">
            {visiblePlans.map((plan, i) => {
              const tier = getPlanTier(plan, billing);
              const isExpertPlan = plan.id === "growth-expert";
              const originalPrice =
                tier.originalPrice ??
                (isExpertPlan ? "$997" : null);
              const promoLabel =
                tier.promo ?? (isExpertPlan ? "70% OFF" : null);
              const ctaLower = (plan.cta || "").toLowerCase();
              const isTalkToUsCta =
                ctaLower.includes("talk to") || ctaLower.includes("contact");
              const planCtaHref = signupHref;
              const BadgeIcon = isExpertPlan ? Star : Crown;
              // Expert card: hide redundant "Everything in Growth AI" summary / Included group.
              const displayPlan = isExpertPlan
                ? {
                    ...plan,
                    description: "",
                    featureGroups: (plan.featureGroups ?? []).filter(
                      (group) => group.label.toLowerCase() !== "included",
                    ),
                  }
                : plan;

              return (
                <Reveal key={plan.id} delay={i * 0.06} className="h-full min-w-0">
                  <motion.div
                    key={`${plan.id}-${billing}`}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`landing-pricing-card relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white p-4 sm:p-5 ${
                      isExpertPlan
                        ? "landing-pricing-card-expert border border-[#c9d7ff] shadow-[0_14px_36px_rgba(24,119,242,0.12)]"
                        : "border border-[#e8edf5] shadow-[0_12px_32px_rgba(15,23,42,0.07)]"
                    }`}
                  >
                    <PricingCardGlow />

                    <div className="relative z-[1] flex flex-wrap items-center gap-2">
                      {plan.badge ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide text-white"
                          style={
                            isExpertPlan
                              ? {
                                  backgroundColor: BRAND_COLORS.blue,
                                  boxShadow: "0 4px 12px rgba(24, 119, 242, 0.28)",
                                }
                              : {
                                  backgroundColor: BRAND_COLORS.pink,
                                  boxShadow: "0 4px 12px rgba(225, 48, 108, 0.28)",
                                }
                          }
                        >
                          <BadgeIcon className="size-3 fill-current" aria-hidden />
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="relative z-[1] mt-2">
                      <h3 className="text-[1.2rem] font-extrabold tracking-tight text-brand-navy sm:text-[1.3rem]">
                        {plan.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] leading-snug text-brand-muted">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="relative z-[1] mt-3 min-h-[2.75rem]">
                      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                        {originalPrice ? (
                          <span
                            className="landing-pricing-original-price text-sm font-semibold tracking-tight text-[#94a3b8]"
                            style={{ textDecoration: "line-through" }}
                          >
                            {originalPrice}
                          </span>
                        ) : null}
                        <span className="text-[1.85rem] font-black leading-none tracking-tight text-brand-navy sm:text-[2rem]">
                          {tier.price}
                        </span>
                        {tier.period ? (
                          <span className="pb-0.5 text-[13px] font-medium text-brand-muted">
                            {tier.period}
                          </span>
                        ) : null}
                        {promoLabel ? (
                          <span className="landing-pricing-discount-tag mb-0.5 inline-flex items-center rounded-md bg-gradient-to-r from-[#e11d48] to-[#f43f5e] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(225,29,72,0.35)]">
                            {promoLabel}
                          </span>
                        ) : null}
                      </div>
                      {tier.subline ? (
                        <p className="landing-pricing-tier-subline mt-0.5 text-[11px] text-brand-muted">
                          {tier.subline}
                        </p>
                      ) : null}
                    </div>

                    {displayPlan.description ? (
                      <p className="relative z-[1] mt-2 text-[12px] leading-snug text-brand-body">
                        {displayPlan.description}
                      </p>
                    ) : null}
                    <div className="relative z-[1] flex-1">
                      <PricingPlanFeatures plan={displayPlan} />
                    </div>
                    {isTalkToUsCta ? (
                      <div className="relative z-[1] mt-4 h-10 shrink-0" aria-hidden />
                    ) : (
                      <motion.a
                        href={planCtaHref}
                        whileHover={reduced ? undefined : { scale: 1.01, y: -1 }}
                        whileTap={reduced ? undefined : { scale: 0.99 }}
                        className="relative z-[1] mt-4 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#0f5ed7] text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(24,119,242,0.32)]"
                        onClick={() => {
                          trackProductButtonClick(
                            plan.cta || "Plan CTA",
                            `pricing_${plan.id}`,
                          );
                          trackProductLead(`signup_cta_pricing_${plan.id}`);
                        }}
                      >
                        {plan.cta}
                        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
                      </motion.a>
                    )}
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
          )}
          <p className="mt-4 text-center text-[11px] text-brand-muted sm:text-xs">
            {footerNote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
