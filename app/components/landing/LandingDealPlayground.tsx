"use client";

import { AnimatedCounter } from "@/app/components/landing/LandingMotionParts";
import { OFFER_COLORS } from "@/app/components/landing/landing-brand";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Gift,
  Sparkles,
  Tag,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

type OfferId = "flat" | "bogo" | "first" | "weekend";

const OFFER_TYPES: {
  id: OfferId;
  label: string;
  short: string;
  multiplier: number;
  color: string;
  Icon: LucideIcon;
}[] = [
  { id: "flat", label: "Flat % Off", short: "Flat off", multiplier: 1, color: OFFER_COLORS.flat, Icon: Tag },
  { id: "bogo", label: "BOGO", short: "BOGO", multiplier: 1.35, color: OFFER_COLORS.bogo, Icon: Gift },
  { id: "first", label: "First Visit", short: "First visit", multiplier: 1.2, color: OFFER_COLORS.first, Icon: Sparkles },
  { id: "weekend", label: "Weekend Only", short: "Weekend", multiplier: 0.95, color: OFFER_COLORS.weekend, Icon: CalendarDays },
];

function dealVibe(discount: number) {
  if (discount >= 45) return "Guests will feel the pull instantly";
  if (discount >= 35) return "Strong offer, expect a signup spike";
  if (discount >= 25) return "Balanced deal, steady conversions";
  return "Soft launch, perfect for testing";
}

export function LandingDealPlayground() {
  const reduced = useReducedMotion();
  const [offerId, setOfferId] = useState<OfferId>("flat");
  const [discount, setDiscount] = useState(25);

  const offer = OFFER_TYPES.find((o) => o.id === offerId) ?? OFFER_TYPES[0];
  const sliderFill = ((discount - 10) / 40) * 100;
  const OfferIcon = offer.Icon;

  const projected = useMemo(() => {
    const signups = Math.round(discount * 4.2 * offer.multiplier);
    const revenue = Math.round(signups * (18 + discount * 0.8));
    const roi = (2.8 + discount / 40).toFixed(1);
    return { signups, revenue, roi };
  }, [discount, offer.multiplier]);

  return (
    <section id="playground" className="landing-playground-section scroll-mt-16 md:scroll-mt-24">
      <div className="brand-landing-section relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-section-eyebrow">
            <span className="text-brand-offer">Try it yourself</span>
          </p>
          <h2 className="brand-landing-display mt-3 text-2xl font-semibold sm:mt-4 sm:text-3xl md:text-4xl">
            Build a deal. Watch numbers move.
          </h2>
          <p className="mt-3 text-sm text-brand-body sm:mt-4 sm:text-base">
            Pick an offer, drag the power slider and see your funnel update in real time.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.12)] sm:mt-12"
          style={{ boxShadow: `0 32px 80px rgba(15,23,42,0.11), 0 0 0 1px #e8edf5` }}
        >
          {/* --- Offer type cards --- */}
          <div className="border-b border-[#e8edf5] bg-white px-4 py-4 sm:px-6 sm:py-5">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748b] sm:text-left">
              Choose your offer type
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {OFFER_TYPES.map((o) => {
                const selected = offerId === o.id;
                return (
                  <motion.button
                    key={o.id}
                    type="button"
                    onClick={() => setOfferId(o.id)}
                    whileHover={reduced ? undefined : { y: selected ? 0 : -3 }}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    animate={{ scale: selected ? 1.03 : 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 26 }}
                    className="relative flex flex-col items-center gap-2.5 rounded-2xl px-2 py-3.5 sm:px-3 sm:py-4"
                    style={
                      selected
                        ? {
                            backgroundColor: o.color,
                            boxShadow: `0 14px 32px color-mix(in srgb, ${o.color} 36%, transparent)`,
                          }
                        : {
                            backgroundColor: "#f8faff",
                            boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
                          }
                    }
                    aria-pressed={selected}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                      style={
                        selected
                          ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff" }
                          : {
                              backgroundColor: `color-mix(in srgb, ${o.color} 14%, #ffffff)`,
                              color: o.color,
                            }
                      }
                    >
                      <o.Icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span
                      className="text-xs font-bold leading-snug sm:text-sm"
                      style={{ color: selected ? "#ffffff" : "#1e293b" }}
                    >
                      <span className="hidden sm:inline">{o.label}</span>
                      <span className="sm:hidden">{o.short}</span>
                    </span>
                    {selected ? (
                      <span
                        className="pointer-events-none absolute inset-[3px] rounded-[0.85rem] border border-white/35"
                        aria-hidden
                      />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
            {/* --- Controls --- */}
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{
                  background: `color-mix(in srgb, ${offer.color} 6%, #ffffff)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${offer.color} 12%, #e8edf5)`,
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b]">Your deal</p>

                <div className="mt-3 flex items-center gap-3">
                  <motion.span
                    key={`${offerId}-${discount}`}
                    initial={reduced ? false : { scale: 0.94, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="text-[3.75rem] font-black leading-none tracking-tight sm:text-[4.75rem]"
                    style={{ color: offer.color }}
                  >
                    {discount}%
                  </motion.span>
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${offer.color} 14%, white)`,
                      color: offer.color,
                    }}
                  >
                    <OfferIcon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                </div>

                <p className="mt-2 text-lg font-bold text-brand-navy sm:text-xl">{offer.label}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-brand-body">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: offer.color }} aria-hidden />
                  {dealVibe(discount)}
                </p>
              </div>

              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-brand-navy">Discount power</p>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      color: offer.color,
                      background: `color-mix(in srgb, ${offer.color} 12%, white)`,
                    }}
                  >
                    {Math.round(sliderFill)}% heat
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="landing-playground-range w-full cursor-pointer appearance-none"
                  style={
                    {
                      "--range-accent": offer.color,
                      background: `linear-gradient(to right, ${offer.color} ${sliderFill}%, #e8edf5 ${sliderFill}%)`,
                    } as CSSProperties
                  }
                  aria-label="Discount percentage"
                />
                <div className="mt-2 flex justify-between text-xs font-semibold text-[#64748b]">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Quick projection on left */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {[
                  { label: "Est. signups", value: projected.signups, color: OFFER_COLORS.flat },
                  { label: "Est. revenue", value: projected.revenue, prefix: "$", color: OFFER_COLORS.weekend },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-3 py-2.5"
                    style={{ background: "#f8faff" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">{m.label}</p>
                    <p className="mt-0.5 text-lg font-black" style={{ color: m.color }}>
                      <AnimatedCounter value={m.value} prefix={m.prefix} />
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Dark preview stage --- */}
            <div className="relative overflow-hidden bg-[#0b1220] p-6 sm:p-8 lg:p-10">
              <motion.div
                className="pointer-events-none absolute -right-8 top-1/3 h-48 w-48 rounded-full blur-3xl"
                animate={
                  reduced ? { opacity: 0.22 } : { opacity: [0.18, 0.32, 0.18], scale: [1, 1.06, 1] }
                }
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundColor: offer.color }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
                aria-hidden
              />

              <div className="relative mx-auto flex h-full max-w-[18rem] flex-col">
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    <span className="relative flex h-2 w-2">
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                        style={{ backgroundColor: offer.color }}
                      />
                      <span
                        className="relative inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: offer.color }}
                      />
                    </span>
                    Live funnel
                  </span>
                  <TrendingUp className="h-4 w-4 text-white/25" aria-hidden />
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <motion.div
                    animate={reduced ? undefined : { y: [0, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mx-auto w-full"
                  >
                    <div
                      className="absolute -inset-3 rounded-[2.2rem] opacity-40 blur-2xl"
                      style={{ backgroundColor: offer.color }}
                      aria-hidden
                    />
                    <div className="relative rounded-[2rem] border-[3px] border-[#243044] bg-[#131a28] p-2 shadow-[0_28px_64px_rgba(0,0,0,0.5)]">
                      <div className="mx-auto mb-2.5 h-1 w-12 rounded-full bg-white/15" aria-hidden />
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${offerId}-${discount}`}
                          initial={reduced ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduced ? undefined : { opacity: 0, y: -6 }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          className="overflow-hidden rounded-[1.35rem] p-4 text-white sm:p-5"
                          style={{
                            backgroundColor: "#0a0f18",
                            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 0 ${offer.color}`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `color-mix(in srgb, ${offer.color} 22%, transparent)` }}
                            >
                              <OfferIcon className="h-4 w-4" style={{ color: offer.color }} strokeWidth={2.25} />
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                              Your business
                            </p>
                          </div>
                          <p className="mt-4 text-[2rem] font-black leading-none sm:text-[2.25rem]" style={{ color: offer.color }}>
                            {discount}%
                          </p>
                          <p className="mt-1 text-base font-bold text-white">{offer.label}</p>
                          <p className="mt-3 text-xs leading-relaxed text-white/55">
                            Limited spots. Sign up and redeem with QR at your door.
                          </p>
                          <motion.div
                            animate={reduced ? undefined : { scale: [1, 1.025, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="mt-5 w-full rounded-full bg-white py-2.5 text-center text-xs font-black"
                            style={{ color: offer.color }}
                          >
                            Claim this deal →
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                {/* Metrics */}
                <div
                  className="mt-7 grid grid-cols-3 divide-x divide-white/10 rounded-2xl py-3"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  {[
                    { label: "Signups", value: projected.signups, color: OFFER_COLORS.flat },
                    { label: "Revenue", value: projected.revenue, prefix: "$", color: OFFER_COLORS.weekend },
                    { label: "ROI", value: Number(projected.roi), suffix: "x", decimals: 1, color: OFFER_COLORS.bogo },
                  ].map((m) => (
                    <div key={m.label} className="px-2 text-center">
                      <motion.p
                        key={m.value}
                        initial={reduced ? false : { scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 480, damping: 22 }}
                        className="text-base font-black sm:text-lg"
                        style={{ color: m.color }}
                      >
                        <AnimatedCounter
                          value={m.value}
                          prefix={m.prefix}
                          suffix={m.suffix}
                          decimals={m.decimals}
                        />
                      </motion.p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/35">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-[#e8edf5] bg-[#fafbfd] p-5 sm:p-6">
            <motion.a
              href="#account"
              whileHover={reduced ? undefined : { scale: 1.012, y: -1 }}
              whileTap={reduced ? undefined : { scale: 0.988 }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white sm:text-base"
              style={{
                backgroundColor: offer.color,
                boxShadow: `0 10px 28px color-mix(in srgb, ${offer.color} 34%, transparent)`,
              }}
            >
              Launch this deal
              <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
