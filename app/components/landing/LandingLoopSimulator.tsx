"use client";

import { AnimatedCounter } from "@/app/components/landing/LandingMotionParts";
import {
  JOURNEY_STEP_COLORS,
} from "@/app/components/landing/landing-brand";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Megaphone,
  MousePointerClick,
  Pause,
  Play,
  QrCode,
  RotateCcw,
  UserPlus,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState, type ComponentType } from "react";

type JourneyStep = {
  id: keyof typeof JOURNEY_STEP_COLORS;
  label: string;
  short: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  metric: number;
  metricPrefix?: string;
  metricSuffix?: string;
  metricDecimals?: number;
  metricLabel: string;
  headline: string;
  body: string;
};

const STEPS: JourneyStep[] = [
  {
    id: "ad",
    label: "Ad click",
    short: "Ad",
    icon: Megaphone,
    color: JOURNEY_STEP_COLORS.ad,
    metric: 2411,
    metricLabel: "Clicks this week",
    headline: "Customer taps your Meta or Google ad",
    body: "Every click is tagged so you know which campaign started the journey.",
  },
  {
    id: "funnel",
    label: "Deal page",
    short: "Page",
    icon: MousePointerClick,
    color: JOURNEY_STEP_COLORS.funnel,
    metric: 847,
    metricLabel: "Landing page views",
    headline: "They land on your branded deal funnel",
    body: "Your offer, urgency and brand. Not a generic link in bio page.",
  },
  {
    id: "signup",
    label: "Signup",
    short: "Join",
    icon: UserPlus,
    color: JOURNEY_STEP_COLORS.signup,
    metric: 186,
    metricLabel: "New customers captured",
    headline: "Customer claims your offer",
    body: "Customer details are captured instantly for future marketing.",
  },
  {
    id: "pay",
    label: "Pay",
    short: "Pay",
    icon: CreditCard,
    color: JOURNEY_STEP_COLORS.pay,
    metric: 124,
    metricPrefix: "$",
    metricLabel: "Prepaid revenue",
    headline: "Optional Stripe checkout",
    body: "Collect upfront for prepaid deals straight to your account.",
  },
  {
    id: "qr",
    label: "QR scan",
    short: "Scan",
    icon: QrCode,
    color: JOURNEY_STEP_COLORS.qr,
    metric: 8.4,
    metricPrefix: "$",
    metricSuffix: "K",
    metricDecimals: 1,
    metricLabel: "In store revenue",
    headline: "Customer scans QR at your location",
    body: "Redemption closes the loop. See which ad drove the visit.",
  },
  {
    id: "return",
    label: "Return visit",
    short: "Return",
    icon: RotateCcw,
    color: JOURNEY_STEP_COLORS.return,
    metric: 68,
    metricSuffix: "%",
    metricLabel: "Customers who came back",
    headline: "They become a repeat customer",
    body: "Follow-ups bring customers back. Prove which ad started the relationship.",
  },
];

type LandingLoopSimulatorProps = {
  className?: string;
  /** Hero placement, tighter, less chrome */
  variant?: "default" | "hero";
};

export function LandingLoopSimulator({
  className = "",
  variant = "default",
}: LandingLoopSimulatorProps) {
  const isHero = variant === "hero";
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = STEPS[active];

  const goNext = useCallback(() => {
    setActive((i) => (i + 1) % STEPS.length);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(goNext, 2800);
    return () => window.clearInterval(timer);
  }, [playing, goNext]);

  return (
    <div className={`landing-simulator-vivid relative w-full min-w-0 ${isHero ? "landing-simulator-hero" : ""} ${className}`.trim()}>
      <div
        className={`landing-simulator-inner overflow-hidden rounded-[1.35rem] ${isHero ? "p-2.5 sm:p-6 lg:p-7 xl:p-8" : "p-5 sm:p-8 sm:rounded-[1.85rem]"}`}
      >
        <div className={`flex items-center justify-between gap-2 ${isHero ? "mb-2 sm:mb-4" : "mb-4 sm:mb-6 sm:gap-3"}`}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="landing-live-dot shrink-0" aria-hidden />
            <p className="landing-simulator-muted truncate text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.18em]">
              Live customer journey
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="landing-theme-toggle inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold sm:gap-1.5 sm:px-3.5 sm:text-xs"
            aria-pressed={playing}
          >
            {playing ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
        </div>

        <div className="relative">
          <div
            className={`absolute left-[8%] right-[8%] top-[1.85rem] h-1 overflow-hidden rounded-full ${isHero ? "top-[1.65rem] block sm:top-[1.85rem]" : "hidden sm:block"}`}
            style={{ background: "var(--landing-simulator-line)" }}
          >
            <motion.div
              className="h-full origin-left rounded-full"
              style={{ backgroundColor: step.color }}
              animate={{ scaleX: Math.max(0.08, active / (STEPS.length - 1)) }}
              transition={{ duration: 0.5, ease: easeOut }}
            />
          </div>

          <div
            className={`grid gap-0.5 sm:gap-2 ${
              isHero ? "grid-cols-6 landing-simulator-steps-6" : "grid-cols-6"
            }`}
          >
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              const isDone = i < active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setPlaying(false);
                  }}
                  className="group flex min-w-0 flex-col items-center gap-1 rounded-lg sm:gap-2 sm:rounded-xl sm:p-2"
                  aria-current={isActive ? "step" : undefined}
                  aria-label={s.label}
                >
                  <motion.span
                    className={`relative flex items-center justify-center rounded-xl sm:rounded-2xl ${
                      isHero
                        ? "h-8 w-8 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                        : "h-9 w-9 sm:h-12 sm:w-12 md:h-14 md:w-14"
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: s.color,
                            boxShadow: `0 0 28px ${s.color}44, 0 10px 24px ${s.color}28`,
                          }
                        : isDone
                          ? { backgroundColor: `${s.color}18`, color: s.color }
                          : {
                              background: "var(--landing-simulator-step-idle)",
                              color: "var(--landing-simulator-step-idle-icon)",
                            }
                    }
                    animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                    transition={
                      isActive
                        ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                  >
                    <Icon
                      className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]"
                      style={{ color: isActive ? "#fff" : isDone ? s.color : undefined }}
                    />
                  </motion.span>
                  <span
                    className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide sm:text-[10px] md:text-[11px]"
                    style={{ color: isActive ? s.color : "var(--landing-simulator-muted)" }}
                  >
                    {s.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className={`landing-simulator-panel overflow-hidden rounded-xl sm:rounded-2xl ${isHero ? "landing-simulator-hero-panel mt-4 sm:mt-4" : "mt-4 sm:mt-6"}`}
          >
            <div className="h-1 w-full" style={{ backgroundColor: step.color }} />
            <div
              className={
                isHero
                  ? "landing-simulator-hero-panel-inner flex flex-row items-start justify-between gap-2.5 p-2.5 sm:gap-4 sm:p-5"
                  : "flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-5"
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0" style={{ color: step.color }} />
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.14em]"
                    style={{ color: step.color }}
                  >
                    Step {active + 1}, {step.label}
                  </p>
                </div>
                <h3 className="landing-simulator-text mt-1 text-[13px] font-bold leading-snug sm:mt-2 sm:text-lg lg:text-xl md:text-xl">
                  {step.headline}
                </h3>
                <p
                  className={`landing-simulator-body landing-simulator-muted mt-1.5 text-sm leading-relaxed sm:mt-2 ${isHero ? "hidden sm:block" : ""}`}
                >
                  {step.body}
                </p>
              </div>
              <motion.div
                className={`shrink-0 rounded-xl text-center sm:rounded-2xl ${
                  isHero
                    ? "w-auto min-w-[4.75rem] px-2 py-1.5 sm:min-w-0 sm:px-5 sm:py-4"
                    : "w-full px-4 py-3 sm:w-auto sm:px-5 sm:py-4"
                }`}
                style={{
                  backgroundColor: `${step.color}12`,
                  border: `1px solid ${step.color}30`,
                }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <p className="landing-simulator-text text-lg font-black tabular-nums sm:text-3xl lg:text-[2rem]">
                  <AnimatedCounter
                    value={step.metric}
                    prefix={step.metricPrefix}
                    suffix={step.metricSuffix}
                    decimals={step.metricDecimals}
                  />
                </p>
                <p className="landing-simulator-muted mt-1 text-[10px] font-bold uppercase tracking-wider">
                  {step.metricLabel}
                </p>
              </motion.div>
            </div>

            {!isHero ? (
              <div className="flex gap-1 px-4 pb-4 sm:px-6 sm:pb-6">
                {STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Go to ${s.label}`}
                    onClick={() => {
                      setActive(i);
                      setPlaying(false);
                    }}
                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i <= active ? s.color : "var(--landing-simulator-line)",
                      opacity: i === active ? 1 : i < active ? 0.85 : 0.45,
                      transform: i === active ? "scaleY(1.35)" : "scaleY(1)",
                    }}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {!isHero ? (
          <p className="landing-simulator-muted mt-3 flex items-center justify-center gap-1.5 px-1 text-center text-[11px] sm:mt-4 sm:text-xs lg:justify-start">
            Tap a step or press play to watch the customer journey
          </p>
        ) : null}
      </div>
    </div>
  );
}
