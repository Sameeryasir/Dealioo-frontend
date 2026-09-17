"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessMetaAdsQuestionStep.module.css";
import "@/app/components/register-business/register-business-responsive.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type IntegrationWhyReason = {
  icon?: LucideIcon;
  title: string;
  description: string;
};

export type RegisterBusinessIntegrationWhyStepProps = {
  progressLabel: string;
  badge: ReactNode;
  title: ReactNode;
  subtitle: string;
  detail?: string;
  reasons: readonly IntegrationWhyReason[];
  sidebarTitle: string;
  sidebarText: string;
  sidebarExtraTitle?: string;
  sidebarExtraText?: string;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
  embedded?: boolean;
  dataAttr?: string;
};

export default function RegisterBusinessIntegrationWhyStep({
  progressLabel,
  badge,
  title,
  subtitle,
  detail,
  reasons,
  sidebarTitle,
  sidebarText,
  sidebarExtraTitle,
  sidebarExtraText,
  onContinue,
  onSkip,
  onBack,
  embedded = false,
  dataAttr = "data-register-business-why",
}: RegisterBusinessIntegrationWhyStepProps) {
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
            <h2 className={styles.title} style={{ fontWeight: 600 }}>
              {title}
            </h2>
            <p className={styles.subtitle}>{subtitle}</p>
            {detail ? (
              <p className={styles.subtitle} style={{ marginTop: "0.35rem" }}>
                {detail}
              </p>
            ) : null}
          </header>

          <p className={styles.sectionLabel} style={{ fontWeight: 500 }}>
            Why connect this?
          </p>
          <ul className={styles.steps}>
            {reasons.map((item, index) => (
              <li key={item.title}>
                <span
                  className={styles.stepNum}
                  aria-hidden
                  style={{ fontWeight: 500 }}
                >
                  {index + 1}
                </span>
                <span className={styles.stepText} style={{ fontWeight: 400 }}>
                  <span
                    style={{
                      display: "block",
                      color: "#07111f",
                      marginBottom: "0.2rem",
                      fontWeight: 400,
                    }}
                  >
                    {item.title}
                  </span>
                  {item.description}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={styles.primaryBtn}
            style={{ fontWeight: 600 }}
            onClick={onContinue}
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

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
            <h3 className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
              {sidebarTitle}
            </h3>
            <p className={styles.sidebarText}>{sidebarText}</p>
          </div>
          {sidebarExtraTitle && sidebarExtraText ? (
            <div className={styles.sidebarBlock}>
              <h3 className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
                {sidebarExtraTitle}
              </h3>
              <p className={styles.sidebarText}>{sidebarExtraText}</p>
            </div>
          ) : null}
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle} style={{ fontWeight: 600 }}>
              What happens next
            </h3>
            <p className={styles.sidebarText}>
              We will ask if you already have an account. If not, we will show
              you how to create one, then help you connect it to this business.
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
