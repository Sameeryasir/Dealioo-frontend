"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import "@/app/components/register-business/register-business-responsive.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type RegisterBusinessIntegrationAccountQuestionStepProps = {
  progressLabel: string;
  badge: ReactNode;
  title: ReactNode;
  subtitle: string;
  yesHint: string;
  noHint: string;
  noIcon: LucideIcon;
  sidebarTitle: string;
  sidebarText: string;
  onHasAccount: () => void;
  onNoAccount: () => void;
  onSkip: () => void;
  onBack?: () => void;
  embedded?: boolean;
  dataAttr?: string;
};

export default function RegisterBusinessIntegrationAccountQuestionStep({
  progressLabel,
  badge,
  title,
  subtitle,
  yesHint,
  noHint,
  noIcon: NoIcon,
  sidebarTitle,
  sidebarText,
  onHasAccount,
  onNoAccount,
  onSkip,
  onBack,
  embedded = false,
  dataAttr = "data-register-business-account-question",
}: RegisterBusinessIntegrationAccountQuestionStepProps) {
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
            <span className={styles.badge}>{badge}</span>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </header>

          <div className={styles.choiceGrid}>
            <button
              type="button"
              className={styles.choiceYes}
              onClick={onHasAccount}
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              <span className={styles.choiceLabel}>Yes, I have one</span>
              <span className={styles.choiceHint}>{yesHint}</span>
            </button>

            <button
              type="button"
              className={styles.choiceNo}
              onClick={onNoAccount}
            >
              <NoIcon className="h-5 w-5" aria-hidden />
              <span className={styles.choiceLabel}>No, not yet</span>
              <span className={styles.choiceHint}>{noHint}</span>
            </button>
          </div>

          <div className={styles.footerLinks}>
            {onBack ? (
              <button type="button" className={styles.backBtn} onClick={onBack}>
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

      <aside className={styles.sidebar} aria-label="Why this matters">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why this matters</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>{sidebarTitle}</h3>
            <p className={styles.sidebarText}>{sidebarText}</p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>What happens next</h3>
            <p className={styles.sidebarText}>
              If you already have an account, we&apos;ll connect it next. If
              not, we&apos;ll show you how to create one first.
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
