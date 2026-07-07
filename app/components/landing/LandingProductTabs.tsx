"use client";

/**
 * Tabbed product preview, Ads / Funnels / QR with unique mini UIs.
 */
import { LOGO_COLORS, LOGO_SPECTRUM } from "@/app/components/landing/landing-brand";
import { easeOut } from "@/app/components/landing/landing-motion";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Megaphone, QrCode, Repeat, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const TABS = [
  {
    id: "ads",
    label: "Ads",
    color: LOGO_COLORS.blue,
    icon: Megaphone,
    title: "Run ads that drive real visits",
    description: "Connect Meta and Google. Build campaigns and see which ads start the guest journey.",
    preview: "ads",
  },
  {
    id: "funnels",
    label: "Funnels",
    color: LOGO_COLORS.pink,
    icon: Users,
    title: "Turn clicks into signed up guests",
    description: "Branded funnel pages, guest capture and Stripe checkout in one flow.",
    preview: "funnel",
  },
  {
    id: "loyalty",
    label: "QR and loyalty",
    color: LOGO_COLORS.green,
    icon: Repeat,
    title: "Bring guests back with QR and automations",
    description: "Track redemptions, trigger follow ups and see lifetime guest activity.",
    preview: "loyalty",
  },
] as const;

function PreviewPanel({ type }: { type: string }) {
  if (type === "ads") {
    return (
      <div className="space-y-3 p-1">
        {[
          { name: "Weekend Burger Ad", roi: "4.8x", spend: "$420" },
          { name: "Lunch Special", roi: "2.1x", spend: "$180" },
          { name: "New Guest Offer", roi: "6.2x", spend: "$290" },
        ].map((row, i) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, ease: easeOut }}
            className="landing-preview-row flex items-center justify-between rounded-xl border px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold">{row.name}</p>
              <p className="landing-text-muted text-xs">Spend {row.spend}</p>
            </div>
            <span className="rounded-lg bg-brand-retain/10 px-2.5 py-1 text-sm font-bold text-brand-retain">
              {row.roi} ROI
            </span>
          </motion.div>
        ))}
        <div className="flex h-12 items-end gap-1.5 pt-2">
          {[40, 65, 50, 88, 72, 95, 60].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-md"
              style={{ backgroundColor: LOGO_SPECTRUM[i % LOGO_SPECTRUM.length] }}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease: easeOut }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === "funnel") {
    return (
      <div className="landing-tabs-preview rounded-xl p-4">
        <div className="rounded-lg p-4 shadow-sm" style={{ background: "var(--landing-bg-card)" }}>
          <div className="h-2 w-16 rounded" style={{ background: "var(--landing-border)" }} />
          <div className="mt-4 h-8 w-3/4 rounded-lg" style={{ background: "color-mix(in srgb, var(--landing-text) 10%, transparent)" }} />
          <div className="mt-2 h-3 w-full rounded" style={{ background: "var(--landing-border)" }} />
          <div className="mt-1 h-3 w-5/6 rounded" style={{ background: "var(--landing-border)" }} />
          <motion.div
            className="mt-5 h-10 rounded-lg bg-brand-primary"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Email captured", "Payment ready", "QR sent"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="landing-preview-row rounded-full border px-2 py-1 text-[9px] font-semibold sm:px-2.5 sm:py-1 sm:text-[10px]"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-2">
      <motion.div
        className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-brand-retain/40 bg-brand-retain/5"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <QrCode className="h-14 w-14 text-brand-retain" strokeWidth={1.25} />
      </motion.div>
      <div className="w-full space-y-2">
        {[
          { guest: "Sarah M.", action: "Redeemed, Ad #2", time: "2m ago" },
          { guest: "James K.", action: "Welcome email sent", time: "14m ago" },
          { guest: "Priya R.", action: "2nd visit tracked", time: "1h ago" },
        ].map((row, i) => (
          <motion.div
            key={row.guest}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="landing-preview-row flex items-center justify-between rounded-xl border px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-semibold">{row.guest}</p>
              <p className="landing-text-muted text-xs">{row.action}</p>
            </div>
            <span className="landing-text-muted text-[10px] font-medium">{row.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function LandingProductTabs() {
  const [activeId, setActiveId] = useState<(typeof TABS)[number]["id"]>("ads");
  const active = TABS.find((t) => t.id === activeId) ?? TABS[0];
  const ActiveIcon = active.icon;

  return (
    <section id="features" className="landing-features-section scroll-mt-16 md:scroll-mt-24">
      <div className="brand-landing-section relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary sm:text-sm">
            The platform
          </p>
          <h2 className="brand-landing-display mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">
            One loop. Three superpowers.
          </h2>
          <p className="landing-text-muted mt-3 text-sm sm:mt-4 sm:text-base">
            Click each phase to see what Dealioo actually does. Not generic marketing fluff.
          </p>
        </div>

        <div className="landing-tabs-scroll -mx-4 mt-8 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                  isActive ? "border-transparent text-white shadow-md" : "landing-tab-idle"
                }`}
                style={isActive ? { backgroundColor: tab.color } : undefined}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid items-stretch gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="flex min-w-0 flex-col justify-center order-2 lg:order-1"
            >
              <div
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${active.color} 12%, var(--landing-bg-card))`,
                  color: active.color,
                }}
              >
                <ActiveIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--landing-text)" }}>
                {active.title}
              </h3>
              <p className="landing-text-muted mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base">{active.description}</p>
              <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                {active.id === "ads" && (
                  <>
                    <FeaturePoint icon={TrendingUp} text="Per campaign ROI dashboard" />
                    <FeaturePoint icon={BarChart3} text="Meta and Google in one place" />
                  </>
                )}
                {active.id === "funnels" && (
                  <>
                    <FeaturePoint icon={Users} text="Guest signup and payment funnels" />
                    <FeaturePoint icon={TrendingUp} text="Custom landing page builder" />
                  </>
                )}
                {active.id === "loyalty" && (
                  <>
                    <FeaturePoint icon={QrCode} text="In store QR redemption" />
                    <FeaturePoint icon={Repeat} text="Automated follow up emails" />
                  </>
                )}
              </ul>
            </motion.div>
          </AnimatePresence>

          <motion.div layout className="landing-tabs-preview order-1 min-h-[240px] min-w-0 rounded-2xl p-4 sm:order-2 sm:min-h-[280px] sm:rounded-3xl sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.preview}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <PreviewPanel type={active.preview} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturePoint({
  icon: Icon,
  text,
}: {
  icon: typeof Megaphone;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm" style={{ color: "var(--landing-text-muted)" }}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </li>
  );
}
