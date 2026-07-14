"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, HelpCircle, Megaphone } from "lucide-react";

export type RegisterBusinessMetaAdsQuestionStepProps = {
  onHasAccount: () => void;
  onNoAccount: () => void;
  onSkip: () => void;
  embedded?: boolean;
};

// How to create a Meta Ad Account — shown under the question for users who need it
const HOW_TO_CREATE = [
  "Go to Meta Business Suite.",
  "Create a Business if you don't already have one.",
  "Open Business Settings.",
  "Navigate to Accounts → Ad Accounts.",
  "Click Add → Create a New Ad Account.",
  "Enter your ad account name, time zone, and currency.",
  "Assign yourself Full Control of the ad account.",
  "Add a payment method (credit/debit card or another supported payment option).",
  "Verify your phone number if Meta requests verification.",
  "Return to Dealioo and continue to connect Facebook so we can load your new ad account.",
] as const;

export default function RegisterBusinessMetaAdsQuestionStep({
  onHasAccount,
  onNoAccount,
  onSkip,
  embedded = false,
}: RegisterBusinessMetaAdsQuestionStepProps) {
  const reduced = useReducedMotion();

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
              <HelpCircle className="h-4 w-4" aria-hidden />
            </span>
            <h2 className={styles.title}>
              Do you have a{" "}
              <span className="landing-hero-accent-blue">Meta Ads</span>{" "}
              account?
            </h2>
            <p className={styles.subtitle}>
              Dealioo connects to Meta Ads so you can see Facebook and
              Instagram ad performance next to your guest results. Tell
              us if you already have an ads account.
            </p>
          </header>

          {/* Instructions sit on the card — no nested box */}
          <p className={styles.sectionLabel}>
            Don&apos;t have one? Create a Meta Ad Account
          </p>
          <ol className={styles.steps}>
            {HOW_TO_CREATE.map((step, index) => (
              <li key={step}>
                <span className={styles.stepNum}>{index + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>
          <p className={styles.tip}>
            <strong>Note:</strong> Your ad account must have an active
            payment method and any required Meta verification completed
            before you can publish ads.
          </p>

          <div className={styles.choiceGrid}>
            <button
              type="button"
              className={styles.choiceYes}
              onClick={onHasAccount}
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              <span className={styles.choiceLabel}>Yes, I have one</span>
              <span className={styles.choiceHint}>
                Continue to connect Meta Ads account
              </span>
            </button>

            <button
              type="button"
              className={styles.choiceNo}
              onClick={onNoAccount}
            >
              <Megaphone className="h-5 w-5" aria-hidden />
              <span className={styles.choiceLabel}>No, not yet</span>
              <span className={styles.choiceHint}>
                We&apos;ll help you create a Meta Ad Account
              </span>
            </button>
          </div>

          <button
            type="button"
            className={styles.skipBtn}
            onClick={onSkip}
          >
            Skip for now
          </button>
        </section>
      </motion.div>

      <aside className={styles.sidebar} aria-label="Why Meta Ads">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why this matters</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>Meta Ad Account</h3>
            <p className={styles.sidebarText}>
              A Meta Ad Account is where Facebook and Instagram campaigns
              live. Dealioo needs one connected so we can pull spend,
              impressions, and clicks for your business.
            </p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>What happens next</h3>
            <p className={styles.sidebarText}>
              If you already have an account, we&apos;ll connect Facebook
              next. If not, we&apos;ll show you how to create one first.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );

  if (embedded) {
    return <div className={styles.zoneEmbedded}>{content}</div>;
  }

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-meta-question
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-meta-question"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Meta Ads setup</span>
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
