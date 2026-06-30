"use client";

/**
 * Animated feature visuals for Built for Growth, rich mini-scenes per Dealioo capability.
 * Tailwind + Framer Motion + inline SVG (no external image files).
 */
import { BRAND_COLORS } from "@/app/components/landing/landing-brand";
import { GoogleAdsLogo, MetaLogo, StripeLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export type FeaturePreviewId =
  | "funnel-editor"
  | "stripe-payments"
  | "meta-google-ads"
  | "qr-redemption"
  | "guest-crm"
  | "automations"
  | "campaign-analytics";

const FEATURE_GRADIENT: Record<FeaturePreviewId, string> = {
  "funnel-editor": "from-[#60a5fa] via-[#3b82f6] to-[#93c5fd]",
  "stripe-payments": "from-[#a78bfa] via-[#8b5cf6] to-[#c4b5fd]",
  "meta-google-ads": "from-[#f472b6] via-[#ec4899] to-[#fb7185]",
  "qr-redemption": "from-[#4ade80] via-[#22c55e] to-[#86efac]",
  "guest-crm": "from-[#c084fc] via-[#a855f7] to-[#e879f9]",
  automations: "from-[#fb923c] via-[#f97316] to-[#fdba74]",
  "campaign-analytics": "from-[#6366f1] via-[#4f46e5] to-[#818cf8]",
};

function useMotionSafe() {
  return useReducedMotion();
}

/** Soft floating orbs behind each preview */
function AmbientOrbs({ colors }: { colors: [string, string] }) {
  const reduced = useMotionSafe();
  if (reduced) return null;

  return (
    <>
      <motion.span
        className="pointer-events-none absolute -left-4 top-2 h-16 w-16 rounded-full blur-2xl"
        style={{ backgroundColor: colors[0] }}
        animate={{ x: [0, 8, 0], y: [0, -6, 0], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.span
        className="pointer-events-none absolute -bottom-2 -right-3 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: colors[1] }}
        animate={{ x: [0, -6, 0], y: [0, 8, 0], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        aria-hidden
      />
    </>
  );
}

function PreviewFrame({
  children,
  gradient,
  orbColors,
  className = "",
}: {
  children: ReactNode;
  gradient: string;
  orbColors: [string, string];
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient} ${className}`}>
      <AmbientOrbs colors={orbColors} />
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

function FunnelEditorPreview() {
  const reduced = useMotionSafe();
  const steps = ["Landing", "Signup", "Pay", "Done"];

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["funnel-editor"]}
      orbColors={["rgba(24,119,242,0.35)", "rgba(74,108,247,0.28)"]}
    >
      <GlassPanel className="flex h-full flex-col">
        <div className="flex gap-1 border-b border-[#e8edf5]/80 bg-[#fafbfd]/90 px-2 py-1.5">
          {steps.map((step, i) => (
            <motion.span
              key={step}
              className="rounded-md px-2 py-0.5 text-[7px] font-bold sm:text-[8px]"
              animate={
                reduced
                  ? undefined
                  : {
                      backgroundColor: i === 0 ? [BRAND_COLORS.blue, BRAND_COLORS.pink, BRAND_COLORS.orange, BRAND_COLORS.green, BRAND_COLORS.blue][0] : undefined,
                    }
              }
              style={{
                backgroundColor: i === 0 ? BRAND_COLORS.blue : "transparent",
                color: i === 0 ? "#fff" : BRAND_COLORS.gray,
              }}
            >
              {!reduced ? (
                <motion.span
                  key={step}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.7 }}
                >
                  {step}
                </motion.span>
              ) : (
                step
              )}
            </motion.span>
          ))}
        </div>

        <div className="flex flex-1 gap-2 p-2">
          <div className="w-[30%] space-y-1.5 rounded-md border border-[#e8edf5] bg-[#f8faff] p-2">
            {[0.75, 1, 0.85, 0.6].map((w, i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full bg-[#dbeafe]"
                initial={reduced ? false : { width: 0, opacity: 0 }}
                whileInView={{ width: `${w * 100}%`, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              />
            ))}
            <motion.div
              className="mt-2 h-5 rounded-md bg-brand-primary/20"
              animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <div className="relative flex flex-1 flex-col overflow-hidden rounded-md border border-[#e8edf5] p-2">
            <motion.div
              className="h-8 rounded-md bg-gradient-to-br from-[#93c5fd] via-[#bfdbfe] to-[#dbeafe]"
              animate={reduced ? undefined : { scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="mt-1.5 h-1 w-2/3 rounded-full bg-[#cbd5e1]"
              initial={reduced ? false : { width: 0 }}
              whileInView={{ width: "66%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div
              className="mt-auto h-4 w-[55%] self-center rounded-full bg-gradient-to-r from-brand-convert to-[#f472b6] shadow-[0_4px_14px_rgba(225,48,108,0.35)]"
              animate={reduced ? undefined : { y: [0, -2, 0], boxShadow: ["0 4px 14px rgba(225,48,108,0.35)", "0 8px 20px rgba(225,48,108,0.45)", "0 4px 14px rgba(225,48,108,0.35)"] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            {!reduced ? (
              <motion.span
                className="pointer-events-none absolute bottom-3 right-3 h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_0_4px_rgba(24,119,242,0.2)]"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

function StripePaymentsPreview() {
  const reduced = useMotionSafe();

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["stripe-payments"]}
      orbColors={["rgba(99,91,255,0.3)", "rgba(225,48,108,0.22)"]}
    >
      <GlassPanel className="relative flex h-full w-full min-h-0 flex-col p-3">
        {!reduced ? (
          <motion.div
            className="pointer-events-none absolute -inset-3 rounded-2xl bg-[#635bff]/20 blur-xl"
            animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            aria-hidden
          />
        ) : null}

        <StripeLogo className="h-3.5 w-auto" />
        <p className="mt-2 text-[8px] font-semibold text-brand-navy">Weekend deal, prepaid</p>
        <motion.p
          className="text-base font-black text-brand-navy"
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          $24.00
        </motion.p>

        <motion.div
          className="mt-2.5 overflow-hidden rounded-lg bg-[#635bff] py-1.5 text-center text-[8px] font-bold text-white shadow-[0_6px_16px_rgba(99,91,255,0.4)]"
          animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {!reduced ? (
            <motion.span
              className="block"
              animate={{ opacity: [1, 0.85, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Pay with Stripe
            </motion.span>
          ) : (
            "Pay with Stripe"
          )}
        </motion.div>

        <motion.p
          className="mt-2 flex items-center justify-center gap-1 text-[7px] font-bold text-brand-retain"
          initial={reduced ? false : { opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            animate={reduced ? undefined : { scale: [1, 1.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            ✓
          </motion.span>
          Guest pass issued
        </motion.p>
      </GlassPanel>
    </PreviewFrame>
  );
}

function MetaGoogleAdsPreview() {
  const reduced = useMotionSafe();
  const stats = [
    { label: "Spend", val: "$842", color: BRAND_COLORS.blue },
    { label: "Clicks", val: "2.4k", color: BRAND_COLORS.pink },
    { label: "Signups", val: "186", color: BRAND_COLORS.green },
  ];

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["meta-google-ads"]}
      orbColors={["rgba(225,48,108,0.28)", "rgba(24,119,242,0.25)"]}
    >
      <GlassPanel className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#e8edf5]/80 px-2.5 py-1.5">
          <div className="flex items-center gap-1.5">
            <MetaLogo className="h-3.5 w-3.5" />
            <GoogleAdsLogo className="h-3.5 w-3.5" />
          </div>
          <motion.span
            className="rounded-full bg-brand-retain/15 px-2 py-0.5 text-[7px] font-bold text-brand-retain"
            animate={reduced ? undefined : { opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            ● Live
          </motion.span>
        </div>

        <div className="flex flex-1 flex-col p-2">
          <motion.div
            className="overflow-hidden rounded-md border border-[#e8edf5]"
            whileHover={reduced ? undefined : { scale: 1.02 }}
          >
            <motion.div
              className="h-7 bg-gradient-to-r from-[#f1f5f9] via-[#e2e8f0] to-[#f1f5f9] bg-[length:200%_100%]"
              animate={reduced ? undefined : { backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <p className="px-2 py-1 text-[7px] font-bold text-brand-navy">$20 off first visit</p>
          </motion.div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="rounded-md px-1 py-1.5 text-center"
                style={{ backgroundColor: `${s.color}12` }}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, ease: easeOut }}
                animate={reduced ? undefined : { y: [0, -2, 0] }}
                {...(reduced
                  ? {}
                  : {
                      transition: {
                        delay: 0.15 + i * 0.1,
                        ease: easeOut,
                        y: { duration: 2.5, repeat: Infinity, delay: i * 0.3 },
                      },
                    })}
              >
                <p className="text-[6px] text-brand-muted">{s.label}</p>
                <p className="text-[8px] font-black" style={{ color: s.color }}>
                  {s.val}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

function QrRedemptionPreview() {
  const reduced = useMotionSafe();

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["qr-redemption"]}
      orbColors={["rgba(52,168,83,0.35)", "rgba(39,155,82,0.25)"]}
    >
      <motion.div
        className="relative flex h-full w-full flex-col"
        animate={reduced ? undefined : { rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <GlassPanel className="relative flex h-full w-full flex-col items-center justify-center p-3">
          <div className="relative mx-auto h-[3.75rem] w-[3.75rem]">
            <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
              <rect x="4" y="4" width="24" height="24" rx="4" fill={BRAND_COLORS.navy} />
              <rect x="36" y="4" width="24" height="24" rx="4" fill={BRAND_COLORS.navy} />
              <rect x="4" y="36" width="24" height="24" rx="4" fill={BRAND_COLORS.navy} />
              <rect x="12" y="12" width="8" height="8" rx="1" fill="#fff" />
              <rect x="44" y="12" width="8" height="8" rx="1" fill="#fff" />
              <rect x="12" y="44" width="8" height="8" rx="1" fill="#fff" />
              {[32, 36, 40, 44, 48, 52].map((x, i) => (
                <rect key={i} x={x} y={36 + (i % 3) * 6} width="4" height="4" rx="0.5" fill={BRAND_COLORS.navy} />
              ))}
            </svg>

            {!reduced ? (
              <motion.div
                className="pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-brand-retain shadow-[0_0_10px_rgba(52,168,83,0.8)]"
                animate={{ top: ["8%", "88%", "8%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
            ) : null}
          </div>

          <motion.p
            className="mt-2 text-center text-[8px] font-bold text-brand-retain"
            initial={reduced ? false : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity, times: [0, 0.2, 0.75, 1] }}
          >
            ✓ Guest verified
          </motion.p>
        </GlassPanel>
      </motion.div>
    </PreviewFrame>
  );
}

function GuestCrmPreview() {
  const reduced = useMotionSafe();
  const guests = [
    { name: "Sarah K.", tag: "Paid", color: BRAND_COLORS.green },
    { name: "Mike R.", tag: "Scanned", color: BRAND_COLORS.blue },
    { name: "Jen L.", tag: "Signed up", color: BRAND_COLORS.pink },
  ];

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["guest-crm"]}
      orbColors={["rgba(131,58,186,0.25)", "rgba(225,48,108,0.2)"]}
    >
      <GlassPanel className="flex h-full flex-col">
        <div className="border-b border-[#e8edf5]/80 px-2.5 py-1.5">
          <motion.div
            className="h-4 rounded-full border border-[#e8edf5] bg-[#f8faff] px-2.5 text-[7px] leading-4 text-brand-muted"
            animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Search guests…
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-1.5 p-2">
          {guests.map((guest, i) => (
            <motion.div
              key={guest.name}
              className="flex items-center gap-2 rounded-lg border border-[#e8edf5]/90 bg-white/90 px-2 py-1.5"
              initial={reduced ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              animate={
                reduced
                  ? undefined
                  : i === 0
                    ? { boxShadow: ["0 0 0 rgba(52,168,83,0)", "0 0 0 3px rgba(52,168,83,0.15)", "0 0 0 rgba(52,168,83,0)"] }
                    : undefined
              }
              transition={
                reduced || i !== 0
                  ? { delay: 0.1 + i * 0.12, ease: easeOut }
                  : { delay: 0.1, ease: easeOut, boxShadow: { duration: 2.5, repeat: Infinity } }
              }
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white"
                style={{ backgroundColor: guest.color }}
              >
                {guest.name[0]}
              </div>
              <p className="min-w-0 flex-1 truncate text-[8px] font-semibold text-brand-navy">{guest.name}</p>
              <span
                className="rounded-md px-1.5 py-0.5 text-[6px] font-bold"
                style={{ backgroundColor: `${guest.color}18`, color: guest.color }}
              >
                {guest.tag}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

function AutomationsPreview() {
  const reduced = useMotionSafe();
  const channels = [
    { label: "Email", color: BRAND_COLORS.blue, delay: 0 },
    { label: "SMS", color: BRAND_COLORS.orange, delay: 0.4 },
    { label: "WhatsApp", color: BRAND_COLORS.green, delay: 0.8 },
  ];

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT.automations}
      orbColors={["rgba(247,119,55,0.28)", "rgba(251,188,5,0.22)"]}
    >
      <GlassPanel className="flex h-full flex-col">
        <p className="border-b border-[#e8edf5]/80 px-2.5 py-1.5 text-[7px] font-bold text-brand-navy">
          After payment → follow-up
        </p>

        <div className="relative flex flex-1 flex-col justify-center gap-2 p-2.5">
          {!reduced ? (
            <motion.div
              className="pointer-events-none absolute left-[1.1rem] top-[1.4rem] bottom-[1.4rem] w-px bg-gradient-to-b from-brand-primary/40 via-brand-convert/40 to-brand-retain/40"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: easeOut }}
              aria-hidden
            />
          ) : null}

          {channels.map((ch, i) => (
            <motion.div
              key={ch.label}
              className="relative flex items-center justify-between rounded-lg border border-[#e8edf5]/90 bg-white/90 px-2.5 py-1.5"
              initial={reduced ? false : { opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <span className="text-[8px] font-semibold text-brand-navy">{ch.label}</span>
              <motion.span
                className="relative h-3 w-6 rounded-full p-0.5"
                style={{ backgroundColor: ch.color }}
                animate={reduced ? undefined : { opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: ch.delay }}
              >
                <motion.span
                  className="block h-2 w-2 rounded-full bg-white shadow-sm"
                  animate={reduced ? undefined : { x: [0, 10, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: ch.delay, ease: "easeInOut" }}
                />
              </motion.span>
            </motion.div>
          ))}
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

function CampaignAnalyticsPreview() {
  const reduced = useMotionSafe();
  const bars = [38, 62, 45, 78, 55, 88, 70];

  return (
    <PreviewFrame
      gradient={FEATURE_GRADIENT["campaign-analytics"]}
      orbColors={["rgba(24,119,242,0.28)", "rgba(74,108,247,0.22)"]}
    >
      <GlassPanel className="flex h-full flex-col">
        <div className="grid grid-cols-3 gap-1.5 border-b border-[#e8edf5]/80 p-2">
          {[
            { label: "Signups", val: "186", c: BRAND_COLORS.blue },
            { label: "Revenue", val: "$4.2k", c: BRAND_COLORS.green },
            { label: "Conv.", val: "5.4%", c: BRAND_COLORS.pink },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              className="rounded-md px-1 py-1 text-center"
              style={{ backgroundColor: `${m.c}10` }}
              initial={reduced ? false : { scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: i * 0.08 }}
            >
              <p className="text-[6px] text-brand-muted">{m.label}</p>
              <p className="text-[8px] font-black" style={{ color: m.c }}>
                {m.val}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative flex flex-1 items-end gap-1 px-2.5 pb-2 pt-2">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-brand-primary via-brand-primary/70 to-brand-primary/30"
              initial={reduced ? false : { height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
              transition={
                reduced
                  ? { duration: 0.55, delay: 0.08 + i * 0.06, ease: easeOut }
                  : {
                      height: { duration: 0.55, delay: 0.08 + i * 0.06, ease: easeOut },
                      opacity: { duration: 2 + i * 0.2, repeat: Infinity },
                    }
              }
            />
          ))}

          {!reduced ? (
            <motion.svg
              className="pointer-events-none absolute inset-x-3 bottom-2 top-3 overflow-visible"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              aria-hidden
            >
              <motion.path
                d="M0,32 Q15,28 25,22 T50,18 T75,8 T100,4"
                fill="none"
                stroke={BRAND_COLORS.pink}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.7 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.4, ease: easeOut }}
              />
            </motion.svg>
          ) : null}
        </div>
      </GlassPanel>
    </PreviewFrame>
  );
}

export function LandingFeaturePreview({ id }: { id: FeaturePreviewId }) {
  switch (id) {
    case "funnel-editor":
      return <FunnelEditorPreview />;
    case "stripe-payments":
      return <StripePaymentsPreview />;
    case "meta-google-ads":
      return <MetaGoogleAdsPreview />;
    case "qr-redemption":
      return <QrRedemptionPreview />;
    case "guest-crm":
      return <GuestCrmPreview />;
    case "automations":
      return <AutomationsPreview />;
    case "campaign-analytics":
      return <CampaignAnalyticsPreview />;
    default:
      return null;
  }
}

export { FEATURE_GRADIENT };
