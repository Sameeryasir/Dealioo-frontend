"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { useCallback, useEffect } from "react";

export type RegisterBusinessCreateMetaAdAccountStepProps = {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
};

const META_BUSINESS_SUITE_URL = "https://business.facebook.com/";

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

export default function RegisterBusinessCreateMetaAdAccountStep({
  onContinue,
  onBack,
  onSkip,
}: RegisterBusinessCreateMetaAdAccountStepProps) {
  const reduced = useReducedMotion();

  const openMetaBusinessSuite = useCallback(() => {
    window.open(META_BUSINESS_SUITE_URL, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    openMetaBusinessSuite();
  }, [openMetaBusinessSuite]);

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-meta-create
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-meta-create"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Create Meta Ad Account
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
                      <Megaphone className="h-4 w-4" aria-hidden />
                    </span>
                    <h2 className={styles.title}>
                      Create a{" "}
                      <span className="landing-hero-accent-blue">
                        Meta Ad Account
                      </span>
                    </h2>
                    <p className={styles.subtitle}>
                      To publish ads with Dealioo, you&apos;ll need a Meta Ad
                      Account. We opened Meta Business Suite in a new tab —
                      follow the steps below, then come back here to connect
                      Facebook.
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
                    <strong>Note:</strong> Your ad account must have an active
                    payment method and any required Meta verification completed
                    before you can publish ads.
                  </p>

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={openMetaBusinessSuite}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open Meta Business Suite again
                  </button>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={onContinue}
                  >
                    I created my account — connect Facebook
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
                    <h3 className={styles.sidebarTitle}>Before you publish</h3>
                    <p className={styles.sidebarText}>
                      Add an active payment method and complete any phone or
                      identity verification Meta requests.
                    </p>
                  </div>
                  <div className={styles.sidebarBlock}>
                    <h3 className={styles.sidebarTitle}>What happens next</h3>
                    <p className={styles.sidebarText}>
                      After your ad account exists, connect Facebook in Dealioo so
                      we can load that account and read performance data.
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
