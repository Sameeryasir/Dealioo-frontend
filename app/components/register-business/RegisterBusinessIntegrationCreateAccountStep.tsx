"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import "@/app/components/register-business/register-business-responsive.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { useCallback, type ReactNode } from "react";

export type RegisterBusinessIntegrationCreateAccountStepProps = {
  progressLabel: string;
  badgeIcon: LucideIcon;
  title: ReactNode;
  subtitle: string;
  steps: readonly string[];
  tip: string;
  openUrl: string;
  createLabel?: string;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  embedded?: boolean;
  dataAttr?: string;
};

export default function RegisterBusinessIntegrationCreateAccountStep({
  progressLabel,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  steps,
  tip,
  openUrl,
  createLabel = "Create",
  onContinue,
  onBack,
  onSkip,
  embedded = false,
  dataAttr = "data-register-business-create-account",
}: RegisterBusinessIntegrationCreateAccountStepProps) {
  const reduced = useReducedMotion();

  const handleCreate = useCallback(() => {
    window.open(openUrl, "_blank", "noopener,noreferrer");
    onContinue();
  }, [onContinue, openUrl]);

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
              <BadgeIcon className="h-4 w-4" aria-hidden />
            </span>
            <h2 className={styles.title} style={{ fontWeight: 600 }}>
              {title}
            </h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          <p className={styles.sectionLabel} style={{ fontWeight: 500 }}>
            How to create your account
          </p>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step}>
                <span
                  className={styles.stepNum}
                  aria-hidden
                  style={{ fontWeight: 500 }}
                >
                  {index + 1}
                </span>
                <span className={styles.stepText} style={{ fontWeight: 400 }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <p className={styles.tip} style={{ fontWeight: 400 }}>
            Note: {tip}
          </p>

          <button
            type="button"
            className={styles.primaryBtn}
            style={{ fontWeight: 600 }}
            onClick={handleCreate}
          >
            {createLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          <p className={styles.subtitle} style={{ marginTop: "0.75rem" }}>
            Create opens signup in a new tab, then takes you to connect.
          </p>

          <div className={styles.footerLinks}>
            <button type="button" className={styles.backBtn} onClick={onBack}>
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

      <aside className={styles.sidebar} aria-label="Creating your account">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Creating your account</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
              Follow the steps
            </h3>
            <p className={styles.sidebarText}>
              Read the full process here, then tap Create. We open signup for
              you and move you to the connect screen next.
            </p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
              After you create
            </h3>
            <p className={styles.sidebarText}>
              Finish any signup steps in the other tab, then complete connect
              in Dealioo when you are ready.
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
      {...{ [dataAttr]: true }}
    >
      <Navbar />
      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main className={`${bookStyles.main} ${styles.main}`}>
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>{progressLabel}</span>
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
