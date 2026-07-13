"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, CreditCard, HelpCircle } from "lucide-react";

export type RegisterBusinessStripeQuestionStepProps = {
  onHasAccount: () => void;
  onNoAccount: () => void;
  onSkip: () => void;
  onBack?: () => void;
};

const HOW_TO_CREATE = [
  "Go to Stripe and create an account (or sign in).",
  "Complete business details Stripe asks for.",
  "Add a bank account or debit card for payouts.",
  "Verify your identity if Stripe requests it.",
  "Return to Dealioo and continue to connect Stripe.",
] as const;

export default function RegisterBusinessStripeQuestionStep({
  onHasAccount,
  onNoAccount,
  onSkip,
  onBack,
}: RegisterBusinessStripeQuestionStepProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-stripe-question
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-stripe-question"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Stripe setup</span>
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
                      <span className="landing-hero-accent-blue">Stripe</span>{" "}
                      account?
                    </h2>
                    <p className={styles.subtitle}>
                      Dealioo uses Stripe so you can get paid from campaigns and
                      funnels. Tell us if you already have a Stripe account.
                    </p>
                  </header>

                  <p className={styles.sectionLabel}>
                    Don&apos;t have one? Create a Stripe account
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
                    <strong>Note:</strong> Payments go to your Stripe account.
                    You can disconnect Stripe from Dealioo anytime in Settings.
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
                        Continue to connect Stripe
                      </span>
                    </button>

                    <button
                      type="button"
                      className={styles.choiceNo}
                      onClick={onNoAccount}
                    >
                      <CreditCard className="h-5 w-5" aria-hidden />
                      <span className={styles.choiceLabel}>No, not yet</span>
                      <span className={styles.choiceHint}>
                        We&apos;ll help you create a Stripe account
                      </span>
                    </button>
                  </div>

                  <div className={styles.footerLinks}>
                    {onBack ? (
                      <button
                        type="button"
                        className={styles.backBtn}
                        onClick={onBack}
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back
                      </button>
                    ) : (
                      <span />
                    )}
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
                    <h3 className={styles.sidebarTitle}>Get paid</h3>
                    <p className={styles.sidebarText}>
                      Stripe is how customer payments from Dealioo funnels and
                      offers reach your bank account.
                    </p>
                  </div>
                  <div className={styles.sidebarBlock}>
                    <h3 className={styles.sidebarTitle}>What happens next</h3>
                    <p className={styles.sidebarText}>
                      If you already have Stripe, we&apos;ll connect it next. If
                      not, we&apos;ll show you how to create one first.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
