"use client";

/**
 * About Us visuals — one animated scene per heading (Who we are / What we do / Our mission).
 * Tailwind + Framer Motion + inline UI mocks (no external image files).
 */
import { BRAND_COLORS } from "@/app/components/landing/landing-brand";
import { GoogleAdsLogo, MetaLogo, StripeLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export type AboutPreviewId = "who-we-are" | "what-we-do" | "our-mission";

const ABOUT_GRADIENT: Record<AboutPreviewId, string> = {
  "who-we-are": "from-[#60a5fa] via-[#3b82f6] to-[#93c5fd]",
  "what-we-do": "from-[#818cf8] via-[#6366f1] to-[#a5b4fc]",
  "our-mission": "from-[#4ade80] via-[#22c55e] to-[#86efac]",
};

function useMotionSafe() {
  return useReducedMotion();
}

function PreviewFrame({
  children,
  gradient,
  className = "",
}: {
  children: ReactNode;
  gradient: string;
  className?: string;
}) {
  return (
    <div
      className={`landing-about-preview-frame relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient} ${className}`}
    >
      <div className="relative z-[1] flex h-full w-full flex-col p-2.5 sm:p-3">{children}</div>
    </div>
  );
}

function GlassPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-white/90 bg-white/95 shadow-[0_10px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Who we are — business-first platform identity */
function WhoWeArePreview() {
  const reduced = useMotionSafe();

  return (
    <PreviewFrame gradient={ABOUT_GRADIENT["who-we-are"]}>
      <GlassPanel className="flex h-full w-full min-h-0 flex-col">
        <div className="border-b border-[#e8edf5]/80 px-3 py-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-muted">Who we are</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-3">
          <motion.div
            className="landing-about-who-card relative mx-auto w-full max-w-[9.5rem] overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8faff]"
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-14 bg-gradient-to-br from-[#dbeafe] via-[#bfdbfe] to-[#93c5fd]" />
            <div className="relative px-3 pb-3 pt-2">
              <div className="absolute -top-4 left-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-primary" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-[9px] font-bold text-brand-navy">Your business</p>
              <p className="text-[7px] text-brand-muted">Local dining brand</p>
            </div>
          </motion.div>

          <motion.div
            className="rounded-full bg-brand-primary px-3 py-1 text-[8px] font-bold text-white shadow-[0_6px_16px_rgba(24,119,242,0.35)]"
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
            {...(reduced ? {} : { transition: { scale: { duration: 2.2, repeat: Infinity } } })}
          >
            Built for business operators
          </motion.div>
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

/** What we do — ads, funnels, Stripe and QR connected */
function WhatWeDoPreview() {
  const reduced = useMotionSafe();
  const nodes = [
    { label: "Ads", content: <MetaLogo className="h-3 w-3" /> },
    { label: "Funnel", content: <span className="text-[8px] font-black text-brand-primary">→</span> },
    { label: "Pay", content: <StripeLogo className="h-3 w-auto" /> },
    { label: "QR", content: <span className="text-[7px] font-bold text-brand-retain">Scan</span> },
  ];

  return (
    <PreviewFrame gradient={ABOUT_GRADIENT["what-we-do"]}>
      <GlassPanel className="flex h-full w-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-[#e8edf5]/80 px-3 py-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-muted">What we do</p>
          <div className="flex items-center gap-1">
            <MetaLogo className="h-3 w-3" />
            <GoogleAdsLogo className="h-3 w-3" />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 p-3">
          <div className="flex items-center justify-between gap-1">
            {nodes.map((node, i) => (
              <div key={node.label} className="flex flex-1 items-center">
                <motion.div
                  className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-[#e8edf5] bg-[#f8faff] px-1 py-2"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.1, ease: easeOut }}
                  animate={reduced ? undefined : { y: [0, -2, 0] }}
                  {...(reduced
                    ? {}
                    : {
                        transition: {
                          delay: 0.08 + i * 0.1,
                          ease: easeOut,
                          y: { duration: 2.4, repeat: Infinity, delay: i * 0.35 },
                        },
                      })}
                >
                  <div className="flex h-5 items-center justify-center">{node.content}</div>
                  <p className="text-[6px] font-bold text-brand-navy">{node.label}</p>
                </motion.div>
                {i < nodes.length - 1 ? (
                  <motion.span
                    className="mx-0.5 text-[8px] font-bold text-brand-muted"
                    animate={reduced ? undefined : { opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                    aria-hidden
                  >
                    ›
                  </motion.span>
                ) : null}
              </div>
            ))}
          </div>

          <motion.p
            className="text-center text-[8px] font-bold text-brand-navy"
            animate={reduced ? undefined : { opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Ads, funnels, Stripe checkout and QR, all connected
          </motion.p>
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

/** Our mission — see who clicked, paid and walked in */
function OurMissionPreview() {
  const reduced = useMotionSafe();
  const steps = [
    { label: "Clicked", detail: "Meta ad", color: BRAND_COLORS.blue, done: true },
    { label: "Paid", detail: "$24 Stripe", color: BRAND_COLORS.orange, done: true },
    { label: "Walked in", detail: "QR scan", color: BRAND_COLORS.green, done: false },
  ];

  return (
    <PreviewFrame gradient={ABOUT_GRADIENT["our-mission"]}>
      <GlassPanel className="flex h-full w-full min-h-0 flex-col">
        <div className="border-b border-[#e8edf5]/80 px-3 py-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-muted">Our mission</p>
          <p className="mt-0.5 text-[8px] font-bold text-brand-navy">Guest: Sarah M.</p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2.5 p-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-2 rounded-lg border border-[#e8edf5] bg-[#f8faff] px-2.5 py-2"
              initial={reduced ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.12, ease: easeOut }}
            >
              <motion.span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: step.done ? step.color : `${step.color}55` }}
                animate={
                  reduced || step.done
                    ? undefined
                    : { scale: [1, 1.15, 1], boxShadow: [`0 0 0 0 ${step.color}44`, `0 0 0 6px ${step.color}00`, `0 0 0 0 ${step.color}00`] }
                }
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                {step.done ? "✓" : i + 1}
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold text-brand-navy">{step.label}</p>
                <p className="text-[7px] text-brand-muted">{step.detail}</p>
              </div>
              {!reduced && !step.done ? (
                <motion.span
                  className="rounded-full bg-brand-retain/15 px-2 py-0.5 text-[6px] font-bold text-brand-retain"
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  Live
                </motion.span>
              ) : null}
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

export function LandingAboutPreview({ id }: { id: AboutPreviewId }) {
  const preview =
    id === "who-we-are" ? (
      <WhoWeArePreview />
    ) : id === "what-we-do" ? (
      <WhatWeDoPreview />
    ) : id === "our-mission" ? (
      <OurMissionPreview />
    ) : null;

  if (!preview) return null;

  return (
    <div className="landing-about-preview-inner h-full w-full" data-about-preview={id}>
      {preview}
    </div>
  );
}
