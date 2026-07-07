"use client";

/**
 * Hero — outcome headline, audience line, journey simulator.
 * Business rule: primary CTA → signup; secondary → meeting booking form.
 */
import { LandingLoopSimulator } from "@/app/components/landing/LandingLoopSimulator";
import { headlineLine, easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

function HeroAudienceLine({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.div
      className="landing-hero-audience-wrap"
      initial={{ opacity: 0, y: reduced ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
    >
      <p className="landing-hero-audience-line landing-hero-audience-pill">
        <span className="landing-hero-audience-pill-dot" aria-hidden />
        <span className="landing-hero-audience-pill-text">
          The AI Growth Platform for{" "}
          <span className="landing-hero-audience-accent">Local Businesses</span>
        </span>
      </p>
    </motion.div>
  );
}

function HeroSubline({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.p
      className="landing-hero-subline landing-hero-subline-short"
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.55, ease: easeOut }}
    >
      Create AI-powered offers, run Meta & Google Ads and automatically turn first-time
      customers into repeat customers.
    </motion.p>
  );
}

export function LandingHero({ signupHref }: { signupHref: string }) {
  const reduced = useReducedMotion();

  return (
    <section
      id="loop"
      className="landing-hero-vivid landing-hero-editorial scroll-mt-16 md:scroll-mt-20"
    >
      <div className="brand-landing-section landing-hero-main">
        <div className="landing-hero-editorial-grid landing-hero-mobile-stack">
          <motion.div
            className="landing-hero-copy landing-hero-copy-column w-full min-w-0 lg:mx-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <div className="landing-hero-copy-middle">
              <HeroAudienceLine reduced={reduced} />

              <motion.h1
                className="landing-hero-headline landing-hero-headline-outcome"
                initial="hidden"
                animate="visible"
              >
                <motion.span custom={0} variants={headlineLine} className="landing-hero-headline-line">
                  Turn every{" "}
                  <span className="landing-hero-accent-blue">ad click</span>
                </motion.span>
                <motion.span
                  custom={0.08}
                  variants={headlineLine}
                  className="landing-hero-headline-line landing-hero-headline-line-2"
                >
                  into a{" "}
                  <span className="landing-hero-accent-pink">repeat customer.</span>
                </motion.span>
              </motion.h1>

              <HeroSubline reduced={reduced} />
            </div>

            <motion.div
              className="landing-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.6, ease: easeOut }}
            >
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={signupHref}
                  className="landing-btn-primary inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 px-6 text-[15px] font-bold sm:h-[3.25rem] sm:w-auto sm:min-w-[200px] sm:px-8 sm:text-base"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/book-meeting"
                  className="landing-btn-secondary landing-hero-btn-outline inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold sm:h-12 sm:w-auto"
                >
                  <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                  Book a Meeting
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <div className="landing-hero-visual-wrap landing-hero-visual-column">
            <div
              id="demo"
              className="landing-hero-visual w-full min-w-0 max-w-full scroll-mt-24"
            >
              <div className="landing-hero-glass-frame">
                <LandingLoopSimulator variant="hero" className="landing-hero-simulator" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
