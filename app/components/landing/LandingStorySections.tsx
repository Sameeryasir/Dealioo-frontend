"use client";

/**
 * Product story sections, How it works, Built for growth, Why Dealioo
 * Business rule: explain the closed-loop customer journey (education, not a second hero).
 */
import {
  LandingFeaturePreview,
  type FeaturePreviewId,
} from "@/app/components/landing/LandingFeaturePreviews";
import {
  LandingAboutIllustration,
} from "@/app/components/landing/LandingAboutIllustration";
import type { AboutPreviewId } from "@/app/components/landing/LandingAboutPreviews";
import {
  JOURNEY_STEP_COLORS,
  BRAND_COLORS,
} from "@/app/components/landing/landing-brand";

import type { CSSProperties } from "react";
import { useState } from "react";
import { Reveal } from "@/app/components/landing/LandingMotionParts";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MousePointerClick,
  QrCode,
  Repeat,
  Route,
  UserPlus,
} from "lucide-react";

const HOW_STEPS = [
  { label: "Advertise", hint: "Meta or Google campaign", icon: Megaphone, color: JOURNEY_STEP_COLORS.ad },
  { label: "Landings", hint: "Branded offer page", icon: MousePointerClick, color: JOURNEY_STEP_COLORS.funnel },
  { label: "Claim Offer", hint: "Customer details captured", icon: UserPlus, color: JOURNEY_STEP_COLORS.signup },
  { label: "Checkout", hint: "Stripe payment", icon: CreditCard, color: JOURNEY_STEP_COLORS.pay },
  { label: "Redeem", hint: "QR verified in store", icon: QrCode, color: JOURNEY_STEP_COLORS.qr },
  { label: "Return", hint: "Automations & CRM", icon: Repeat, color: JOURNEY_STEP_COLORS.return },
] as const;

const GROWTH_FEATURES = [
  { id: "funnel-editor" as FeaturePreviewId, title: "Funnel editor", accent: BRAND_COLORS.blue },
  { id: "stripe-payments" as FeaturePreviewId, title: "Stripe payments", accent: "#635bff" },
  { id: "meta-google-ads" as FeaturePreviewId, title: "Meta & Google Ads", accent: BRAND_COLORS.pink },
  { id: "qr-redemption" as FeaturePreviewId, title: "QR redemption", accent: BRAND_COLORS.green },
  { id: "guest-crm" as FeaturePreviewId, title: "Guest CRM", accent: BRAND_COLORS.violet },
  { id: "automations" as FeaturePreviewId, title: "Automations", accent: BRAND_COLORS.orange },
  { id: "campaign-analytics" as FeaturePreviewId, title: "Campaign analytics", accent: "#4A6CF7" },
] as const;

const GROWTH_FEATURE_COUNT = GROWTH_FEATURES.length;
const GROWTH_TOP_ROW = GROWTH_FEATURES.slice(0, 4);
const GROWTH_BOTTOM_ROW = GROWTH_FEATURES.slice(4, GROWTH_FEATURE_COUNT);

const WHY_POINTS = [
  {
    title: "Ads tied to outcomes",
    body: "Connect Meta and Google Ads, launch campaigns, track signups, payments and revenue in one place.",
    icon: Megaphone,
    color: JOURNEY_STEP_COLORS.ad,
  },
  {
    title: "One customer record",
    body: "Landing pages, signups, Stripe payments, QR scans and follow-ups all share the same customer record—no spreadsheets.",
    icon: Route,
    color: JOURNEY_STEP_COLORS.funnel,
  },
  {
    title: "One dashboard",
    body: "Create your business profile, launch campaigns and track every customer journey from one place.",
    icon: LayoutDashboard,
    color: JOURNEY_STEP_COLORS.return,
  },
] as const;

/** Mobile 3×2 — bottom row reversed so one inverted-C line covers all 6 steps. */
const MOBILE_HOW_GRID_STEPS = [
  HOW_STEPS[0],
  HOW_STEPS[1],
  HOW_STEPS[2],
  HOW_STEPS[5],
  HOW_STEPS[4],
  HOW_STEPS[3],
] as const;

/** Inverted ⌐ — top-row icon centers y=46, bottom-row y=124 (viewBox 300×162). */
const MOBILE_HOW_CURVE_PATH = "M 50 46 H 250 V 124 H 50";

function HowItWorksStepIcon({
  step,
  index,
  reduced,
}: {
  step: (typeof HOW_STEPS)[number];
  index: number;
  reduced: boolean | null;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      className="landing-how-step-icon relative z-10 flex h-11 w-11 items-center justify-center rounded-xl text-white sm:h-[3.25rem] sm:w-[3.25rem] sm:rounded-2xl"
      style={{ backgroundColor: step.color, "--step-color": step.color } as CSSProperties}
      initial={{ opacity: 0, y: reduced ? 0 : 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay: reduced ? 0 : 0.12 + index * 0.07 }}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </motion.div>
  );
}

export function LandingHowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="how-it-works" className="landing-story-section scroll-mt-16 md:scroll-mt-24">
      <Reveal className="brand-landing-section relative z-10 mx-auto max-w-3xl text-center">
        <p className="landing-section-eyebrow">How Dealioo works</p>
        <h2 className="brand-landing-display landing-section-heading landing-how-section-heading">
          Most platforms stop after the click.{" "}
          <span className="landing-hero-accent-pink">We don&apos;t.</span>
        </h2>
        <p className="landing-section-intro landing-how-section-intro">
          Acquire, convert and retain customers—{" "}
          <span className="landing-how-accent-green whitespace-nowrap sm:whitespace-normal">all in one platform.</span>
        </p>
      </Reveal>

      <motion.div
        className="landing-how-rail mt-6 sm:mt-7"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, ease: easeOut }}
      >
        <div className="landing-how-scroll">
          <div className="brand-landing-section landing-how-track relative w-full min-w-0 py-4 sm:py-5">
            {/* Desktop — straight horizontal line + traveling blue dot */}
            <motion.div
              className="landing-how-connector-line pointer-events-none absolute z-0 hidden sm:block"
              aria-hidden
              initial={{ scaleX: reduced ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: reduced ? 0 : 0.9, ease: easeOut, delay: 0.15 }}
            />
            {!reduced ? (
              <motion.span
                className="landing-how-connector-dot pointer-events-none absolute z-[1] hidden sm:block"
                aria-hidden
                animate={{ left: ["6%", "94%"] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
              />
            ) : null}

            {/* Mobile — inverted ⌐ path; each cell = icon + label + hint (same as desktop) */}
            <div className="landing-how-mobile-layout relative mx-auto max-w-[21rem] px-2 sm:hidden" role="list" aria-label="Customer journey steps">
              <svg
                className="landing-how-mobile-path pointer-events-none absolute inset-x-0 top-0 z-0 h-[10.125rem] w-full"
                viewBox="0 0 300 162"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  id="landing-how-mobile-curve"
                  d={MOBILE_HOW_CURVE_PATH}
                  fill="none"
                  stroke="#7c8da8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {!reduced ? (
                  <>
                    <circle r="7" fill="#f8faff" opacity="0.95">
                      <animateMotion dur="7s" repeatCount="indefinite">
                        <mpath href="#landing-how-mobile-curve" />
                      </animateMotion>
                    </circle>
                    <circle r="4.5" fill="#1877f2">
                      <animateMotion dur="7s" repeatCount="indefinite">
                        <mpath href="#landing-how-mobile-curve" />
                      </animateMotion>
                    </circle>
                  </>
                ) : null}
              </svg>

              <div className="relative z-10 grid grid-cols-3 grid-rows-2 gap-x-4 gap-y-5">
                {MOBILE_HOW_GRID_STEPS.map((step, i) => {
                  const labelAboveIcon = i < 3;

                  return (
                  <motion.div
                    key={step.label}
                    role="listitem"
                    className={`landing-how-step flex flex-col items-center text-center${labelAboveIcon ? " landing-how-step--label-above" : ""}`}
                    style={{ "--step-color": step.color } as CSSProperties}
                    initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: reduced ? 0 : 0.12 + i * 0.07, ease: easeOut }}
                  >
                    {labelAboveIcon ? (
                      <p className="landing-how-step-label mb-2 text-xs font-bold leading-tight text-brand-navy">
                        {step.label}
                      </p>
                    ) : null}
                    <HowItWorksStepIcon step={step} index={i} reduced={reduced} />
                    {!labelAboveIcon ? (
                      <p className="landing-how-step-label mt-2.5 text-xs font-bold leading-tight text-brand-navy">
                        {step.label}
                      </p>
                    ) : null}
                  </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Desktop — full steps in one row */}
            <div
              className="landing-how-steps relative z-10 hidden w-full min-w-0 sm:flex sm:items-start sm:justify-between sm:gap-4"
              role="list"
              aria-label="Customer journey steps"
            >
              {HOW_STEPS.map((step, i) => (
                  <motion.div
                    key={step.label}
                    role="listitem"
                    className="landing-how-step group flex min-w-0 flex-1 cursor-default flex-col items-center text-center select-none"
                    style={{ "--step-color": step.color } as CSSProperties}
                    initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: reduced ? 0 : 0.12 + i * 0.07, ease: easeOut }}
                  >
                    <HowItWorksStepIcon step={step} index={i} reduced={reduced} />
                    <p className="landing-how-step-label mt-2 text-sm font-bold leading-tight text-brand-navy">
                      {step.label}
                    </p>
                    <p className="landing-how-step-hint text-[11px] leading-snug">{step.hint}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingBuiltForGrowth() {
  const reduced = useReducedMotion();

  return (
    <section id="growth" className="landing-story-section scroll-mt-16 border-t md:scroll-mt-24" style={{ borderColor: "var(--landing-border)" }}>
      <div className="brand-landing-section relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="landing-section-eyebrow">Built for growth</p>
          <h2 className="brand-landing-display landing-section-heading landing-growth-section-heading">
            Everything you need to grow your{" "}
            <span className="landing-hero-accent-pink">business.</span>
          </h2>
          <p className="landing-section-intro landing-growth-section-intro">
          A complete toolkit for modern{" "}
            <span className="landing-how-accent-green whitespace-nowrap sm:whitespace-normal">
              local businesses.
            </span>
          </p>
        </Reveal>

        <div className="landing-growth-features mx-auto mt-6 flex max-w-6xl flex-col gap-3 md:mt-8 md:gap-3.5">
          {/* Row 1 — mobile 2×2, tablet/desktop 4 columns */}
          <div className="landing-growth-top-grid grid grid-cols-2 items-stretch gap-2.5 md:grid-cols-4 md:gap-3.5">
            {GROWTH_TOP_ROW.map((feature, i) => (
              <GrowthFeatureCard key={feature.id} feature={feature} index={i} reduced={reduced} />
            ))}
          </div>

          {/* Row 2 — mobile 2+1; desktop 3 cards centered in middle */}
          <div className="landing-growth-bottom-grid grid grid-cols-2 items-stretch gap-2.5 md:grid-cols-4 md:gap-3.5">
            {GROWTH_BOTTOM_ROW.map((feature, i) => (
              <GrowthFeatureCard
                key={feature.id}
                feature={feature}
                index={i + 4}
                reduced={reduced}
                className={i === 2 ? "landing-growth-card--mobile-last" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type GrowthFeature = (typeof GROWTH_FEATURES)[number];

function GrowthFeatureCard({
  feature,
  index,
  reduced,
  className,
}: {
  feature: GrowthFeature;
  index: number;
  reduced: boolean | null;
  className?: string;
}) {
  return (
    <Reveal delay={index * 0.04} className={`h-full min-w-0${className ? ` ${className}` : ""}`}>
      <motion.article
        className={`landing-growth-card landing-growth-card--${feature.id} group flex h-full flex-col overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]`}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: easeOut }}
        whileHover={
          reduced
            ? undefined
            : {
                y: -4,
                boxShadow: "0 10px 28px rgba(15, 23, 42, 0.1)",
                transition: { type: "spring", stiffness: 320, damping: 24 },
              }
        }
      >
        <div className="landing-growth-preview relative aspect-[16/11] shrink-0 overflow-hidden p-2">
          <div className="landing-growth-preview-inner h-full min-h-0 w-full overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.02]">
            <LandingFeaturePreview id={feature.id} />
          </div>
        </div>

        <div className="landing-growth-card-label flex items-center gap-2 border-t border-[#e8edf5] bg-[#f8faff] px-3 py-2.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: feature.accent, boxShadow: `0 0 0 2px ${feature.accent}22` }}
            aria-hidden
          />
          <h3 className="truncate text-sm font-bold leading-tight text-brand-navy">
            {feature.title}
          </h3>
        </div>
      </motion.article>
    </Reveal>
  );
}

export function LandingWhyDealioo() {
  const reduced = useReducedMotion();

  return (
    <section
      id="why"
      className="landing-why-section landing-why-section-dark scroll-mt-16 md:scroll-mt-24"
    >
      <div className="brand-landing-section relative z-10">
        <Reveal className="mx-auto max-w-2xl text-center landing-why-section-header">
          <p className="landing-section-eyebrow">Why Dealioo</p>
          <h2 className="brand-landing-display landing-section-heading landing-why-headline">
            <span className="landing-why-headline-mobile">
              <span className="landing-why-headline-mobile-line">
                Built for businesses that need{" "}
                <span className="landing-why-headline-proof-phrase">
                  proof- <span className="landing-why-headline-tail">not guesswork</span>
                </span>
              </span>
            </span>
            <span className="landing-why-headline-desktop">
              Built for businesses that need proof-
              <br className="landing-why-headline-break" aria-hidden />
              <span className="landing-why-headline-tail">not guesswork</span>
            </span>
          </h2>
          <p className="landing-section-intro landing-why-intro">
            <span className="landing-why-intro-mobile">
              Most tools stop after the click. Dealioo tracks every customer interaction through repeat visits.
            </span>
            <span className="landing-why-intro-desktop">
              <span className="landing-why-intro-line">Most tools stop after the click.</span>
              <span className="landing-why-intro-line">Dealioo tracks every customer interaction through repeat visits.</span>
            </span>
          </p>
        </Reveal>

        <div className="relative mt-6 grid gap-4 sm:mt-7 md:grid-cols-3 md:gap-5">
          {WHY_POINTS.map((point, i) => {
            const Icon = point.icon;
            return (
              <Reveal key={point.title} delay={i * 0.08}>
                <motion.article
                  className="landing-why-premium-card group h-full"
                  style={{ "--why-accent": point.color } as CSSProperties}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: easeOut }}
                  whileHover={
                    reduced
                      ? undefined
                      : {
                          y: -4,
                          transition: { type: "spring", stiffness: 320, damping: 22 },
                        }
                  }
                >
                  <div className="landing-why-icon-3d" aria-hidden>
                    <span className="landing-why-icon-shadow" />
                    <span className="landing-why-icon-face">
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-brand-navy sm:text-[1.0625rem]">{point.title}</h3>
                  <p className="landing-section-intro !mt-1.5 !text-sm leading-snug">{point.body}</p>

                  <span className="landing-why-card-shine pointer-events-none" aria-hidden />
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const ABOUT_PILLARS: ReadonlyArray<{
  title: string;
  body: string;
  color: string;
  previewId: AboutPreviewId;
}> = [
  {
    title: "Who we are",
    body: "A deal funnel platform built for local business operators.",
    color: BRAND_COLORS.blue,
    previewId: "who-we-are",
  },
  {
    title: "What we do",
    body: "Ads, funnels, Stripe checkout and QR scanning, all connected.",
    color: "#4A6CF7",
    previewId: "what-we-do",
  },
  {
    title: "Our mission",
    body: "See who clicked, paid and walked in, not just who signed up.",
    color: BRAND_COLORS.green,
    previewId: "our-mission",
  },
];

export function LandingAboutUs() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const pillar = ABOUT_PILLARS[active];

  return (
    <section
      id="about"
      className="landing-about-section relative scroll-mt-16 overflow-hidden border-y border-[#e8edf5] bg-white py-10 sm:py-12 md:scroll-mt-24"
      aria-label="About Dealioo"
    >
      <div className="brand-landing-section relative z-10">
        <div className="landing-about-grid mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal className="landing-about-copy text-center lg:text-left">
            <p className="landing-section-eyebrow">About Dealioo</p>
            <h2 className="brand-landing-display landing-section-heading">
              Deal funnels with{" "}
              <span className="landing-hero-accent-pink">real proof.</span>
            </h2>
            <p className="landing-section-intro">
              Track the complete customer journey from ad click to redemption not just signups.
            </p>

            <div
              className="landing-about-tabs relative mt-6 flex flex-wrap justify-center gap-2 lg:justify-start"
              role="tablist"
              aria-label="About Dealioo topics"
            >
              {ABOUT_PILLARS.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.title}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(i)}
                    className={`landing-about-tab relative overflow-hidden rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-200 sm:px-4 sm:text-sm ${
                      isActive
                        ? "border-transparent text-white shadow-[0_4px_14px_rgba(15,23,42,0.12)]"
                        : "border-[#e8edf5] bg-white text-brand-navy hover:border-[#cbd5e1] hover:bg-[#f8faff]"
                    }`}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="landing-about-tab-active"
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-[1]">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div className="landing-about-panel-wrap mx-auto w-full max-w-md lg:max-w-none">
            <motion.div
              role="tabpanel"
              aria-live="polite"
              className="landing-about-panel relative overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.07)]"
              style={{ borderTopColor: pillar.color, borderTopWidth: 3 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={pillar.title}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                >
                  <LandingAboutIllustration id={pillar.previewId} accentColor={pillar.color} />

                  <div className="landing-about-panel-copy border-t border-[#e8edf5] px-4 py-3 sm:px-5 sm:py-3.5">
                    <p
                      className="landing-about-panel-label text-center text-xs font-bold uppercase tracking-[0.14em] sm:text-sm"
                      style={{ color: pillar.color }}
                    >
                      {pillar.title}
                    </p>
                    <p className="landing-about-panel-body mt-1.5 text-center text-sm leading-relaxed text-brand-body sm:mt-2">
                      {pillar.body}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
