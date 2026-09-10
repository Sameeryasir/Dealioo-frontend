"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessFacebookConnectStep.module.css";
import "@/app/components/register-business/register-business-responsive.css";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { easeOut } from "@/app/components/landing/landing-motion";
import { getSetupAccessToken } from "@/app/lib/auth-session";
import { connectGoogleAdsInPopup } from "@/app/lib/google-oauth-popup";
import { abortGoogleAdsConnect } from "@/app/services/google-ads/abort-google-ads-connect";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Loader2,
  Megaphone,
  Target,
} from "lucide-react";
import { useCallback, useState } from "react";

export type RegisterBusinessGoogleConnectStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

const BENEFITS = [
  {
    icon: Megaphone,
    title: "Run Google campaigns",
    description:
      "Create and manage Search and Performance Max campaigns from Dealioo.",
  },
  {
    icon: BarChart3,
    title: "See ad performance",
    description:
      "Pull spend, clicks, and conversions next to your guest results.",
  },
  {
    icon: Target,
    title: "Track funnel outcomes",
    description:
      "Connect ads to Dealioo funnels so you know which clicks convert.",
  },
] as const;

export default function RegisterBusinessGoogleConnectStep({
  businessId,
  onContinue,
  onBack,
  embedded = false,
}: RegisterBusinessGoogleConnectStepProps) {
  const reduced = useReducedMotion();
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);
    setConnecting(true);

    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Google Ads.");
      }

      const result = await connectGoogleAdsInPopup(token, businessId);
      if (result.status === "connected") {
        onContinue();
        return;
      }

      await abortGoogleAdsConnect(businessId);
      setErrorMessage(
        "Google Ads connect was cancelled. You can try again or skip for now.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect Google Ads. Try again.",
      );
    } finally {
      setConnecting(false);
    }
  }, [businessId, onContinue]);

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
              <GoogleAdsLogo className="h-5 w-5" />
            </span>
            <h2 className={styles.title}>
              Connect{" "}
              <span className="landing-hero-accent-blue">Google Ads</span>
            </h2>
            <p className={styles.subtitle}>
              Use Connect Google Ads to link an existing account or create one
              in Google — Dealioo opens Google and saves the connection here.
            </p>
          </header>

          <h3 className={styles.sectionTitle}>
            What connecting Google Ads unlocks:
          </h3>

          <ul className={styles.permissionList}>
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={styles.permissionItem}>
                  <span className={styles.permissionIcon} aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={styles.permissionTitle}>{item.title}</p>
                    <p className={styles.permissionText}>{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className={styles.privacyBox}>
            <p>
              <strong>Your Privacy Matters:</strong> We only use Google Ads
              access to run and measure campaigns you manage in Dealioo. You can
              disconnect anytime in Settings → Integrations.
            </p>
          </div>

          {errorMessage ? (
            <div className={styles.error} role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <button
            type="button"
            className={styles.connectBtn}
            onClick={() => void handleConnect()}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Connecting Google Ads…
              </>
            ) : (
              <>
                <GoogleAdsLogo className="h-4 w-4" />
                Connect Google Ads
              </>
            )}
          </button>

          <div className={styles.footerLinks}>
            {onBack ? (
              <button
                type="button"
                className={styles.backBtn}
                onClick={onBack}
                disabled={connecting}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className={styles.skipBtn}
              onClick={onContinue}
              disabled={connecting}
            >
              Skip for now
            </button>
          </div>
        </section>
      </motion.div>

      <aside className={styles.sidebar} aria-label="Why connect Google Ads">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why connect Google Ads?</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>Reach more customers</h3>
            <p className={styles.sidebarText}>
              Google Ads helps people find your business when they search.
              Connecting once lets Dealioo manage campaigns alongside Meta.
            </p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>What happens next</h3>
            <p className={styles.sidebarText}>
              After Google is linked, you can invite your team and finish setup
              from the dashboard.
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
      data-register-business-google
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-google"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Connect Google Ads</span>
              <span className={bookStyles.progressPct}>Necessary</span>
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
