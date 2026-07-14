"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessFacebookConnectStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { getSetupAccessToken } from "@/app/lib/auth-session";
import { connectStripe } from "@/app/services/stripe/connect-stripe";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type RegisterBusinessStripeConnectStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

const STRIPE_CONNECT_COMPLETE_MESSAGE = "stripe-connect-complete" as const;
const STRIPE_CONNECT_CANCELLED_MESSAGE = "stripe-connect-cancelled" as const;

const BENEFITS = [
  {
    icon: Wallet,
    title: "Receive payments",
    description:
      "Money from funnel and campaign payments goes to your Stripe account, then to your bank.",
  },
  {
    icon: Shield,
    title: "Secure checkout",
    description:
      "Stripe handles card security and compliance so you don't store sensitive card details yourself.",
  },
  {
    icon: CreditCard,
    title: "Easy to manage",
    description:
      "You can disconnect or reconnect Stripe later anytime from business Settings → Integrations.",
  },
] as const;

export default function RegisterBusinessStripeConnectStep({
  businessId,
  onContinue,
  onBack,
  embedded = false,
}: RegisterBusinessStripeConnectStepProps) {
  const reduced = useReducedMotion();
  const [connecting, setConnecting] = useState(false);
  const [awaitingStripe, setAwaitingStripe] = useState(false);
  const [linked, setLinked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripePopupRef = useRef<Window | null>(null);

  const stopWaiting = useCallback((message?: string) => {
    setAwaitingStripe(false);
    setConnecting(false);
    stripePopupRef.current = null;
    if (message) setErrorMessage(message);
  }, []);

  // If the Stripe popup/tab is closed without finishing, stop the waiting spinner.
  useEffect(() => {
    if (!awaitingStripe || linked) return;

    const timer = window.setInterval(() => {
      const popup = stripePopupRef.current;
      if (popup && popup.closed) {
        stopWaiting(
          "Stripe connect was cancelled. You can try again or skip for now.",
        );
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [awaitingStripe, linked, stopWaiting]);

  // Success / cancel messages from the Stripe return tab.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;

      if (type === STRIPE_CONNECT_COMPLETE_MESSAGE) {
        setLinked(true);
        stopWaiting();
        return;
      }

      if (type === STRIPE_CONNECT_CANCELLED_MESSAGE) {
        stopWaiting(
          "Stripe connect was cancelled. You can try again or skip for now.",
        );
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [stopWaiting]);

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);
    setConnecting(true);

    try {
      const token = getSetupAccessToken().trim();
      if (!token) {
        throw new Error("You're signed out. Sign in again to connect Stripe.");
      }

      const { url } = await connectStripe(token, businessId);
      const popup = window.open(url, "dealioo_stripe_connect");
      stripePopupRef.current = popup;
      if (!popup) {
        throw new Error(
          "Pop-up was blocked. Allow pop-ups for Dealioo, then try again.",
        );
      }
      setAwaitingStripe(true);
      setConnecting(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect Stripe. Try again.",
      );
      setConnecting(false);
      setAwaitingStripe(false);
      stripePopupRef.current = null;
    }
  }, [businessId]);

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
              Connect{" "}
              <span className="landing-hero-accent-blue">Stripe</span>
            </h2>
            <p className={styles.subtitle}>
              Connect Stripe to this business so Dealioo can send
              customer payments to your Stripe account.
            </p>
          </header>

          <h3 className={styles.sectionTitle}>
            What connecting Stripe unlocks:
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
              <strong>Your money stays yours:</strong> Dealioo never
              holds your payout bank details. Stripe is the payment
              provider that moves funds to you.
            </p>
          </div>

          {linked ? (
            <div className={styles.privacyBox} role="status">
              <p className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden
                />
                <span>
                  <strong>Stripe is linked</strong> to this business.
                  Finish any remaining steps in the Stripe window if it
                  is still open, then continue.
                </span>
              </p>
            </div>
          ) : null}

          {awaitingStripe && !linked ? (
            <div className={styles.privacyBox} role="status">
              <p>
                Complete Stripe setup in the window that opened. This
                page will update when your account is linked.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className={styles.error} role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {!linked ? (
            <button
              type="button"
              className={styles.connectBtn}
              onClick={() => void handleConnect()}
              disabled={connecting || awaitingStripe}
            >
              {connecting || awaitingStripe ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden
                  />
                  {awaitingStripe
                    ? "Waiting for Stripe…"
                    : "Opening Stripe…"}
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Continue to Stripe
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={styles.connectBtn}
              onClick={onContinue}
            >
              Continue
            </button>
          )}

          {awaitingStripe && !linked ? (
            <button
              type="button"
              className={styles.connectBtn}
              style={{ marginTop: "0.65rem", opacity: 0.92 }}
              onClick={() => void handleConnect()}
              disabled={connecting}
            >
              Open Stripe again
            </button>
          ) : null}

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

      <aside className={styles.sidebar} aria-label="Why connect Stripe">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why connect Stripe?</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>Payments</h3>
            <p className={styles.sidebarText}>
              Without Stripe, guests can&apos;t pay you through Dealioo
              checkouts. Connect once and reuse it across campaigns.
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
      data-register-business-stripe
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-stripe"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Connect Stripe</span>
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
