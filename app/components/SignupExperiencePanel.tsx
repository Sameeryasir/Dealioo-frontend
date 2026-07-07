"use client";

/**
 * Signup left panel — premium live preview (clean card, home typography, no cheap glows).
 */
import { JOURNEY_STEP_COLORS } from "@/app/components/landing/landing-brand";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Megaphone, QrCode, Store, UserPlus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

const PIPELINE = [
  { label: "Ad click", icon: Megaphone, color: JOURNEY_STEP_COLORS.ad },
  { label: "Signup", icon: UserPlus, color: JOURNEY_STEP_COLORS.signup },
  { label: "Paid", icon: Wallet, color: JOURNEY_STEP_COLORS.pay },
  { label: "Walk-in", icon: QrCode, color: JOURNEY_STEP_COLORS.qr },
] as const;

const INACTIVE_ICON = "#cbd5e1";

function stepTint(color: string, amount = 10) {
  return `color-mix(in srgb, ${color} ${amount}%, #ffffff)`;
}

type LivePreviewCardProps = {
  name: string;
  email: string;
  activeIndex?: number;
  autoPlay?: boolean;
  className?: string;
  variant?: "signup" | "login";
};

function LivePreviewCard({
  name,
  email,
  activeIndex: controlledIndex,
  autoPlay = true,
  className = "",
  variant = "signup",
}: LivePreviewCardProps) {
  const reduced = useReducedMotion();
  const [cycleIndex, setCycleIndex] = useState(0);
  const isLogin = variant === "login";
  const displayName = isLogin
    ? email.trim()
      ? email.split("@")[0] || "Your account"
      : "Your account"
    : name.trim() || "Your restaurant";
  const displayEmail = email.trim() || (isLogin ? "Sign in to view your dashboard" : "you@restaurant.com");
  const cardTitle = isLogin ? "Dashboard snapshot" : "Live preview";
  const journeyLabel = isLogin ? "Active guest funnel" : "Guest journey";

  const activeIndex = controlledIndex ?? cycleIndex;
  const activeStep = PIPELINE[activeIndex];

  useEffect(() => {
    if (!autoPlay || controlledIndex != null || reduced) return;
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % PIPELINE.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [autoPlay, controlledIndex, reduced]);

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04),0_20px_48px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="flex h-1 shrink-0" aria-hidden>
        {PIPELINE.map((node) => (
          <span key={node.label} className="flex-1" style={{ backgroundColor: node.color }} />
        ))}
      </div>

      <div className="shrink-0 border-b border-[#e8edf5] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
            {cardTitle}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <motion.div
          className="flex items-center gap-3 rounded-xl border border-[#e8edf5] px-4 py-3.5"
          animate={{ backgroundColor: stepTint(activeStep.color, 6) }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
            animate={{ backgroundColor: activeStep.color }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Store className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </motion.span>
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={displayName}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="truncate text-sm font-semibold leading-5 text-brand-navy"
              >
                {displayName}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={displayEmail}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="mt-0.5 truncate text-xs leading-4 text-brand-muted"
              >
                {displayEmail}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="rounded-xl border border-[#e8edf5] bg-[#fafbfd] px-3 py-4">
          <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {journeyLabel}
          </p>

          <div className="relative">
            <div className="absolute left-[12.5%] right-[12.5%] top-[1.15rem] hidden h-px bg-[#e8edf5] sm:block">
              <motion.div
                className="h-full origin-left bg-brand-primary/35"
                animate={{ scaleX: Math.max(0.1, activeIndex / (PIPELINE.length - 1)) }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="relative grid grid-cols-4 gap-1.5">
              {PIPELINE.map((node, i) => {
                const isActive = i === activeIndex;
                const isDone = i < activeIndex;
                const Icon = node.icon;

                return (
                  <div key={node.label} className="relative flex flex-col items-center gap-1.5 py-2">
                    {isActive ? (
                      <motion.div
                        layoutId="signup-pipeline-highlight"
                        className="absolute inset-0 rounded-lg border border-[#e8edf5] bg-white"
                        style={{ boxShadow: `inset 0 0 0 1px ${stepTint(node.color, 35)}` }}
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        aria-hidden
                      />
                    ) : null}

                    <span
                      className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300"
                      style={
                        isActive
                          ? { backgroundColor: node.color, color: "#ffffff" }
                          : isDone
                            ? {
                                backgroundColor: stepTint(node.color, 16),
                                color: node.color,
                                boxShadow: `inset 0 0 0 1px ${stepTint(node.color, 40)}`,
                              }
                            : { backgroundColor: "#eef2f7", color: INACTIVE_ICON }
                      }
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </span>

                    <span
                      className="relative z-10 text-[10px] font-semibold leading-none"
                      style={{ color: isActive || isDone ? node.color : "#94a3b8" }}
                    >
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SignupExperiencePanelProps = {
  name: string;
  email: string;
};

export function SignupExperiencePanel({ name, email }: SignupExperiencePanelProps) {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden border-r border-[#e8edf5] bg-white px-7 py-8 lg:flex lg:px-8">
      <div className="relative z-10 shrink-0">
        <p className="landing-section-eyebrow">Free Starter plan</p>
        <h2 className="brand-landing-display mt-3 max-w-[16rem] text-xl font-semibold leading-snug sm:text-2xl">
          Launch <span className="landing-hero-accent-blue">deals</span>.
          <br />
          Track every <span className="landing-hero-accent-pink">guest</span>.
          <br />
          Bring them <span className="landing-hero-accent-green">back</span>.
        </h2>
        <p className="mt-2.5 max-w-[16rem] text-sm leading-relaxed text-brand-body">
          See your brand card update live as you sign up.
        </p>
      </div>

      <div className="relative z-10 mt-6">
        <LivePreviewCard name={name} email={email} autoPlay />
      </div>
    </div>
  );
}

export function SignupPreviewCard({ name, email }: { name: string; email: string; step: number }) {
  return <LivePreviewCard name={name} email={email} autoPlay className="lg:hidden" />;
}

/** Shared login marketing copy — used on left panel (desktop) and form top (mobile) */
export function LoginBrandCopy({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="landing-section-eyebrow">Sign in</p>
      <h2 className="brand-landing-display mt-3 max-w-[16rem] text-xl font-semibold leading-snug sm:text-2xl">
        Pick up your{" "}
        <span className="landing-hero-accent-blue">dashboard</span>.
        <br />
        Manage live{" "}
        <span className="landing-hero-accent-pink">campaigns</span>.
        <br />
        Track every{" "}
        <span className="landing-hero-accent-green">guest</span>.
      </h2>
      <p className="mt-2.5 max-w-[16rem] text-sm leading-relaxed text-brand-body">
        One login — deals, guest data, and campaign performance in one place.
      </p>
    </div>
  );
}

/** Login left panel — sign-in context + dashboard snapshot card */
export function LoginExperiencePanel({ email }: { email: string }) {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden border-r border-[#e8edf5] bg-white px-7 py-8 lg:flex lg:px-8">
      <LoginBrandCopy className="relative z-10 shrink-0" />

      <div className="relative z-10 mt-6">
        <LivePreviewCard name="" email={email} autoPlay variant="login" />
      </div>
    </div>
  );
}

export function LoginPreviewCard({ email }: { email: string }) {
  return <LivePreviewCard name="" email={email} autoPlay variant="login" className="lg:hidden" />;
}
