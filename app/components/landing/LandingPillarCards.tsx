"use client";

/**
 * Three product pillars, asymmetrical bento grid with glass cards.
 * Business rule: Ads → Funnel → QR/CRM guest loop.
 */
import { PILLAR_COLORS } from "@/app/components/landing/landing-brand";
import { Reveal } from "@/app/components/landing/LandingMotionParts";
import { glassHover } from "@/app/components/landing/landing-motion";
import { motion } from "framer-motion";
import { ArrowUpRight, Megaphone, QrCode, Users } from "lucide-react";

const PILLARS = [
  {
    id: "ads",
    title: "Run ads",
    body: "Run Meta and Google campaigns that bring customers to your offer.",
    icon: Megaphone,
    color: PILLAR_COLORS.acquire,
    span: "landing-pillar-bento-acquire",
    step: "01",
  },
  {
    id: "funnels",
    title: "Build funnels",
    body: "Send guests to a branded deal page where they can sign up, pay or claim the offer.",
    icon: Users,
    color: PILLAR_COLORS.convert,
    span: "landing-pillar-bento-convert",
    step: "02",
  },
  {
    id: "guests",
    title: "Track guests",
    body: "Track QR redemptions and use automations to bring customers back.",
    icon: QrCode,
    color: PILLAR_COLORS.retain,
    span: "landing-pillar-bento-retain",
    step: "03",
  },
] as const;

export function LandingPillarCards() {
  return (
    <section id="product" className="landing-pillar-section scroll-mt-16 md:scroll-mt-24">
      <div className="brand-landing-section relative z-10">
        <Reveal className="landing-pillar-intro mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <p className="landing-section-eyebrow">The full guest loop</p>
          <h2 className="brand-landing-display mt-3 text-2xl font-semibold sm:text-3xl md:text-[2.15rem] md:leading-[1.15]">
            Ads. Funnels.{" "}
            <span className="landing-hero-accent-green">Proof.</span>
          </h2>
          <p className="landing-text-muted mt-3 text-sm leading-relaxed sm:text-base">
            Three connected stages, one platform that tracks every step.
          </p>
        </Reveal>

        <div className="landing-pillar-bento mt-8 sm:mt-10 lg:mt-12">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <Reveal key={pillar.id} delay={i * 0.08} className={pillar.span}>
                <motion.article
                  className="landing-pillar-card landing-glass-card group h-full rounded-2xl p-6 sm:p-7 lg:p-8"
                  style={{ borderTopColor: pillar.color }}
                  initial="rest"
                  whileHover="hover"
                  variants={glassHover}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                      style={{
                        backgroundColor: pillar.color,
                        boxShadow: `0 8px 28px ${pillar.color}44`,
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span
                      className="landing-pillar-step text-sm font-bold tabular-nums"
                      style={{ color: pillar.color }}
                    >
                      {pillar.step}
                    </span>
                  </div>
                  <h3 className="landing-pillar-title mt-6 text-xl font-bold sm:text-2xl">
                    {pillar.title}
                  </h3>
                  <p className="landing-pillar-body mt-3 text-sm leading-relaxed sm:text-[0.9375rem]">
                    {pillar.body}
                  </p>
                  <span
                    className="landing-pillar-link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ color: pillar.color }}
                    aria-hidden
                  >
                    Learn more
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
