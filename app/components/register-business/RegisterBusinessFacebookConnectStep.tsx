"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessFacebookConnectStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { getSetupAccessToken } from "@/app/lib/auth-session";
import { connectFacebookInPopup } from "@/app/lib/facebook-oauth-popup";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Eye,
  Loader2,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useCallback, useState } from "react";

export type RegisterBusinessFacebookConnectStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      className={className}
    >
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

const PERMISSIONS = [
  {
    icon: Shield,
    title: "Read ad performance",
    description:
      "This lets us fetch detailed analytics about your advertising campaigns, including reach, engagement, and conversion metrics.",
  },
  {
    icon: Eye,
    title: "View your pages",
    description:
      "We need to see which Facebook Pages you manage so you can select which ones to connect for advertising campaigns.",
  },
  {
    icon: TrendingUp,
    title: "Read page engagement",
    description:
      "This allows us to analyze how your posts and ads are performing on your Facebook Pages, helping you understand what content resonates with your audience.",
  },
] as const;

export default function RegisterBusinessFacebookConnectStep({
  businessId,
  onContinue,
  onBack,
  embedded = false,
}: RegisterBusinessFacebookConnectStepProps) {
  const reduced = useReducedMotion();
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);
    setConnecting(true);

    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Facebook.");
      }

      const result = await connectFacebookInPopup(token, businessId);
      if (result.status === "connected") {
        onContinue();
        return;
      }

      setErrorMessage(
        "Facebook connect was cancelled. You can try again or skip for now.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect Facebook. Try again.",
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
              <FacebookLogo className="h-4 w-4" />
            </span>
            <h2 className={styles.title}>
              Connect{" "}
              <span className="landing-hero-accent-blue">
                Meta Ads
              </span>{" "}
              account
            </h2>
            <p className={styles.subtitle}>
              Connecting your Meta Ads account lets Dealioo track campaign
              metrics from your Facebook and Instagram ads. This gives you
              visibility into how your ad spend translates to guest
              sign-ups and visits.
            </p>
          </header>

          <h3 className={styles.sectionTitle}>
            To provide comprehensive Meta Ads analytics, we need the
            following permissions:
          </h3>

          <ul className={styles.permissionList}>
            {PERMISSIONS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={styles.permissionItem}>
                  <span className={styles.permissionIcon} aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={styles.permissionTitle}>{item.title}</p>
                    <p className={styles.permissionText}>
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className={styles.privacyBox}>
            <p>
              <strong>Your Privacy Matters:</strong> We only use these
              permissions to provide the features you&apos;ve requested.
              We never post to your Facebook account or access personal
              information beyond what&apos;s necessary for analytics.
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
                Connecting…
              </>
            ) : (
              <>
                <FacebookLogo className="h-4 w-4" />
                Continue to Meta Ads
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

      <aside className={styles.sidebar} aria-label="Why connect Meta Ads">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why connect Meta Ads?</p>
          <div className={styles.sidebarBlock}>
            <span className={styles.sidebarIcon} aria-hidden>
              <BarChart3 className="h-4 w-4" />
            </span>
            <h3 className={styles.sidebarTitle}>Reporting</h3>
            <p className={styles.sidebarText}>
              Once connected, Dealioo can pull in ad performance data
              from Facebook and Instagram. This means you can see your ad
              spend, impressions, and clicks alongside Dealioo&apos;s own
              conversion data — all in one place.
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
      data-register-business-facebook
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-facebook"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>
                Connect Meta Ads account
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
