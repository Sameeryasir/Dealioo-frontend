"use client";

/**
 * Get Started — white section; dark gradient card (shared section typography).
 */
import { landingAuthHref } from "@/app/components/landing/landing-auth";
import { scaleIn } from "@/app/components/landing/landing-motion";
import { motion } from "framer-motion";
import Link from "next/link";

type LandingAuthEntryProps = {
  returnTo?: string | null;
};

export function LandingAuthEntry({ returnTo }: LandingAuthEntryProps) {
  const signupHref = landingAuthHref("/auth/signup", returnTo);
  const loginHref = landingAuthHref("/auth/login", returnTo);

  return (
    <motion.div
      className="landing-auth-cta-card-dark w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#05070d_0%,#0a1628_48%,#0f1f3d_100%)] px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_48px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.06)] sm:px-12 sm:py-10"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={0.1}
      variants={scaleIn}
      aria-label="Get started with Dealioo"
    >
      <div className="landing-auth-cta-inner mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="landing-section-eyebrow">Get started</p>

        <h2 className="brand-landing-display landing-section-heading">
          Ready to launch{" "}
          <span className="landing-dark-accent-pink">your first deal?</span>
        </h2>

        <p className="landing-section-intro landing-auth-cta-intro">
          Create your account, connect Stripe and launch your first deal all from one dashboard.
        </p>

        <div className="mt-7 flex w-full max-w-xl flex-col gap-3 sm:mt-8 sm:max-w-2xl sm:flex-row">
          <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} className="w-full sm:flex-1">
            <Link
              href={signupHref}
              className="landing-btn-primary flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} className="w-full sm:flex-1">
            <Link
              href={loginHref}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-white/30 bg-white/[0.04] text-sm font-bold text-white transition-colors hover:border-white/45 hover:bg-white/[0.08]"
            >
              Log In
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
