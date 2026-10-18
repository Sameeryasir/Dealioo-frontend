"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessFacebookConnectStep.module.css";
import "@/app/components/register-business/register-business-responsive.css";
import { ChooseNumberDialog } from "@/app/components/business/ChooseNumberDialog";
import { easeOut } from "@/app/components/landing/landing-motion";
import { businessQueryKeys } from "@/app/services/business/business-query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Phone,
  Shield,
} from "lucide-react";
import { useCallback, useState } from "react";

export type RegisterBusinessTwilioConnectStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  embedded?: boolean;
};

const BENEFITS = [
  {
    icon: MessageSquare,
    title: "SMS through Dealioo",
    description:
      "Messages go out on Dealioo's Twilio account. You do not connect your own Twilio login.",
  },
  {
    icon: Phone,
    title: "Choose a number",
    description:
      "Pick or buy a phone number on Dealioo's Twilio account for this business.",
  },
  {
    icon: Shield,
    title: "Change it later",
    description:
      "You can change or remove the number anytime in Settings → Integrations.",
  },
] as const;

function TwilioMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden role="img">
      <circle cx="12" cy="12" r="12" fill="#F22F46" />
      <circle cx="8.2" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="8.2" r="2.15" fill="#fff" />
      <circle cx="8.2" cy="15.8" r="2.15" fill="#fff" />
      <circle cx="15.8" cy="15.8" r="2.15" fill="#fff" />
    </svg>
  );
}

export default function RegisterBusinessTwilioConnectStep({
  businessId,
  onContinue,
  onSkip,
  onBack,
  embedded = false,
}: RegisterBusinessTwilioConnectStepProps) {
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [numberDialogOpen, setNumberDialogOpen] = useState(false);

  const handleConnect = useCallback(() => {
    setErrorMessage(null);
    setNumberDialogOpen(true);
  }, []);

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
              <TwilioMark className="h-5 w-5" />
            </span>
            <h2 className={styles.title}>
              Connect{" "}
              <span className="landing-hero-accent-blue">Twilio</span>
            </h2>
            <p className={styles.subtitle}>
              Paste your Twilio Account SID and Auth Token from the Twilio
              Console. Dealioo will use this account to send SMS for this
              business.
            </p>
          </header>

          <h3 className={styles.sectionTitle}>
            What connecting Twilio unlocks:
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
              <strong>Dealioo Twilio:</strong> This business does not connect
              its own Twilio account. SMS uses Dealioo&apos;s Twilio service.
              You only choose a phone number.
            </p>
          </div>

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
              onClick={handleConnect}
            >
              <>
                <TwilioMark className="h-4 w-4" />
                Choose a number
              </>
            </button>
          ) : (
            <button type="button" className={styles.connectBtn} onClick={onContinue}>
              Continue
            </button>
          )}

          <div className={styles.footerLinks}>
            {onBack ? (
              <button
                type="button"
                className={styles.backBtn}
                onClick={onBack}
                disabled={false}
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
              onClick={onSkip ?? onContinue}
              disabled={false}
            >
              Skip for now
            </button>
          </div>
        </section>
      </motion.div>

      <aside className={styles.sidebar} aria-label="Why connect Twilio">
        <div className={styles.sidebarInner}>
          <p className={styles.sidebarEyebrow}>Why connect Twilio?</p>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>SMS on Dealioo Twilio</h3>
            <p className={styles.sidebarText}>
              Campaign and guest messages are sent with Dealioo&apos;s Twilio
              account. Each business still gets its own phone number.
            </p>
          </div>
          <div className={styles.sidebarBlock}>
            <h3 className={styles.sidebarTitle}>What happens next</h3>
            <p className={styles.sidebarText}>
              After Twilio is linked, you can finish setup from the dashboard.
              Pick or buy a number anytime in Settings → Integrations.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className={styles.zoneEmbedded}>{content}</div>
      ) : (
        <div
          className={`landing-page ${bookStyles.shell}`}
          data-register-business-page
          data-register-business-twilio
        >
          <Navbar />

          <div className={bookStyles.pageContent}>
            <div className={bookStyles.pageContentGrain} aria-hidden />
            <main
              id="register-business-twilio"
              className={`${bookStyles.main} ${styles.main}`}
            >
              <div className={`${bookStyles.formZone} ${styles.zone}`}>
                <div className={bookStyles.progressMeta}>
                  <span className={bookStyles.progressLabel}>Connect Twilio</span>
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
      )}

      <ChooseNumberDialog
        open={numberDialogOpen}
        businessId={businessId}
        title="Choose a Twilio number"
        description="Pick a number you own, or search for one to buy on your Twilio account."
        confirmLabel="Save number"
        confirmingLabel="Saving number…"
        onClose={() => setNumberDialogOpen(false)}
        onConfirmed={async () => {
          setNumberDialogOpen(false);
          await queryClient.invalidateQueries({
            queryKey: businessQueryKeys.twilioPhoneNumbers(businessId),
          });
          onContinue();
        }}
      />
    </>
  );
}
