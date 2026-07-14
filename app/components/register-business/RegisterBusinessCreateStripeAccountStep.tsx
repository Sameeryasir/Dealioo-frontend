"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useCallback, useEffect } from "react";

export type RegisterBusinessCreateStripeAccountStepProps = {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  embedded?: boolean;
};

const STRIPE_SIGNUP_URL = "https://dashboard.stripe.com/register";

const HOW_TO_CREATE = [
  "Go to Stripe and click Sign up.",
  "Enter your email and create a password.",
  "Add your business details when Stripe asks.",
  "Add a bank account or debit card for payouts.",
  "Complete any identity verification Stripe requests.",
  "Return to Dealioo and continue to connect Stripe.",
] as const;

export default function RegisterBusinessCreateStripeAccountStep({
  onContinue,
  onBack,
  onSkip,
  embedded = false,
}: RegisterBusinessCreateStripeAccountStepProps) {
  const reduced = useReducedMotion();

  const openStripeSignup = useCallback(() => {
    window.open(STRIPE_SIGNUP_URL, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    if (embedded) return;
    openStripeSignup();
  }, [embedded, openStripeSignup]);

  const content = (
    <div className={styles.layout}>
      <motion.div
        className={styles.column}
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut }}
      >
        <section className={styles.card}>
          <header className={styles.header}>
            <span className={styles.badge}>
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
            <h2 className={styles.title}>
              Create a{" "}
              <span className="landing-hero-accent-blue">Stripe</span>{" "}
              account
            </h2>
            <p className={styles.subtitle}>
              {embedded
                ? "To get paid with Dealioo, you'll need a Stripe account. Open Stripe signup below, follow the steps, then come back here to connect."
                : "To get paid with Dealioo, you'll need a Stripe account. We opened Stripe signup in a new tab — follow the steps below, then come back here to connect."}
            </p>
          </header>

          <p className={styles.sectionLabel}>Instructions</p>
          <ol className={styles.steps}>
            {HOW_TO_CREATE.map((step, index) => (
              <li key={step}>
                <span className={styles.stepNum}>{index + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>

          <p className={styles.tip}>
            <strong>Note:</strong> Stripe may ask you to verify your
            business before you can receive payouts.
          </p>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={openStripeSignup}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {embedded ? "Open Stripe signup" : "Open Stripe signup again"}
          </button>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onContinue}
          >
            I created my account — connect Stripe
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
            <button
              type="button"
              className={styles.skipBtnInline}
              onClick={onSkip}
            >
              Skip for now
            </button>
          </div>
        </section>
      </motion.div>

      <aside className={styles.sidebar} aria-label="Why Stripe">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why this matters</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>Payouts</h3>
            <p className={styles.sidebarText}>
              Once Stripe is connected, customer payments from Dealioo
              can be sent to your bank.
            </p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>What happens next</h3>
            <p className={styles.sidebarText}>
              After your Stripe account exists, connect it in Dealioo so
              we can process payments for this business.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );

  if (embedded) {
    return (
      <div className={`${styles.zoneEmbedded} ${styles.zoneEmbeddedStripe}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-stripe-create
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-stripe-create"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Create Stripe account
              </span>
              <span className={bookStyles.progressPct}>Optional</span>
            </div>

            <div className={bookStyles.progressTrack} aria-hidden>
              <motion.div
                className={bookStyles.progressFill}
                initial={false}
                animate={{ width: "100%" }}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            </div>

            {content}
          </div>
        </main>
      </div>
    </div>
  );
}
