"use client";

import Navbar from "@/app/components/Navbar";
import bookStyles from "@/app/components/book-meeting/BookMeetingForm.module.css";
import styles from "@/app/components/register-business/RegisterBusinessIntegrationsStep.module.css";
import { easeOut } from "@/app/components/landing/landing-motion";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Link2,
  Megaphone,
  Settings2,
} from "lucide-react";

export type RegisterBusinessIntegrationsStepProps = {
  businessId: number;
  businessName: string;
  onContinue: () => void;
};

const GUIDES = [
  {
    id: "stripe",
    icon: CreditCard,
    accent: "stripe",
    title: "Stripe — get paid",
    why: "Use this if customers pay you through Dealioo (campaigns, offers, funnels).",
    steps: [
      "Open Settings → Integrations.",
      "Find Stripe and click Connect.",
      "Sign in to your Stripe account (or create one if you don’t have it).",
      "Approve the connection, then return here. You’ll see Connected when it’s done.",
    ],
    tip: "Money from customer payments goes to your Stripe account. You can disconnect later anytime.",
  },
  {
    id: "facebook",
    icon: Megaphone,
    accent: "facebook",
    title: "Facebook / Meta Ads — run and track ads",
    why: "Use this if you advertise on Facebook or Instagram and want Dealioo to help with campaigns and reporting.",
    steps: [
      "Open Settings → Integrations.",
      "Click Connect with Facebook.",
      "Log in with the Facebook account that manages your ads.",
      "Allow the requested permissions, then pick the ad account you want to use.",
      "When you return, Facebook should show as Connected.",
    ],
    tip: "Use the business Facebook account that owns your ads — not a personal profile if you can avoid it.",
  },
  {
    id: "google",
    icon: Link2,
    accent: "google",
    title: "Google Ads — connect your ad account",
    why: "Use this if you run Google Ads and want spend and campaign data linked in Dealioo.",
    steps: [
      "Open Settings → Integrations.",
      "Click Connect with Google.",
      "Sign in with the Google account tied to your Google Ads.",
      "Choose the correct Google Ads customer / account when asked.",
      "Return to Dealioo — it should show Connected.",
    ],
    tip: "If you manage ads for someone else, pick the Ads account you actually use for this business.",
  },
] as const;

export default function RegisterBusinessIntegrationsStep({
  businessId,
  businessName,
  onContinue,
}: RegisterBusinessIntegrationsStepProps) {
  const reduced = useReducedMotion();
  const integrationsHref = businessSettingsHref(businessId, "integrations");

  return (
    <div
      className={`landing-page ${bookStyles.shell}`}
      data-register-business-page
      data-register-business-integrations
    >
      <Navbar />

      <div className={bookStyles.pageContent}>
        <div className={bookStyles.pageContentGrain} aria-hidden />
        <main
          id="register-business-integrations"
          className={`${bookStyles.main} ${styles.main}`}
        >
          <div className={`${bookStyles.formZone} ${styles.zone}`}>
            <div className={bookStyles.progressMeta}>
              <span className={bookStyles.progressLabel}>Connect integrations</span>
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
                <header className={styles.header}>
                  <span className={styles.stepBadge}>
                    <Settings2 className="h-4 w-4" aria-hidden />
                  </span>
                  <h2 className={styles.title}>
                    Set up your{" "}
                    <span className="landing-hero-accent-blue">integrations</span>
                  </h2>
                  <p className={styles.subtitle}>
                    Integrations connect {businessName || "your business"} to tools
                    like Stripe and ads. You don’t need them to start — connect now
                    or later from Settings. Below is a simple guide for beginners.
                  </p>
                </header>

                <section className={styles.overviewCard}>
                  <h3 className={styles.overviewTitle}>What is an integration?</h3>
                  <p className={styles.overviewText}>
                    Think of it like plugging in a power cord. Dealioo is the app;
                    Stripe, Facebook, and Google are other tools. Connecting them
                    lets Dealioo talk to those tools safely — take payments, and
                    work with your ads — without you copying data by hand.
                  </p>
                  <ul className={styles.overviewList}>
                    <li>
                      <CheckCircle2 className={styles.check} aria-hidden />
                      You stay in control — you approve each connection.
                    </li>
                    <li>
                      <CheckCircle2 className={styles.check} aria-hidden />
                      You can skip this and connect later anytime.
                    </li>
                    <li>
                      <CheckCircle2 className={styles.check} aria-hidden />
                      Path later: Settings → Integrations.
                    </li>
                  </ul>
                </section>

                <div className={styles.guideStack}>
                  {GUIDES.map((guide) => {
                    const Icon = guide.icon;
                    const accentClass =
                      guide.accent === "stripe"
                        ? styles.accent_stripe
                        : guide.accent === "facebook"
                          ? styles.accent_facebook
                          : styles.accent_google;

                    return (
                      <article
                        key={guide.id}
                        className={`${styles.guideCard} ${accentClass}`}
                      >
                        <div className={styles.guideHead}>
                          <span className={styles.guideIcon} aria-hidden>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className={styles.guideTitle}>{guide.title}</h3>
                            <p className={styles.guideWhy}>{guide.why}</p>
                          </div>
                        </div>

                        <p className={styles.howLabel}>How to connect</p>
                        <ol className={styles.steps}>
                          {guide.steps.map((step, index) => (
                            <li key={step}>
                              <span className={styles.stepNum}>{index + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>

                        <p className={styles.tip}>
                          <strong>Tip:</strong> {guide.tip}
                        </p>
                      </article>
                    );
                  })}
                </div>

                <section className={styles.whereCard}>
                  <h3 className={styles.whereTitle}>Where do I find this later?</h3>
                  <p className={styles.whereText}>
                    After you finish setup, go to your business dashboard, open{" "}
                    <strong>Settings</strong>, then choose{" "}
                    <strong>Integrations</strong>. You’ll see Stripe, Facebook, and
                    Google Ads with Connect buttons.
                  </p>
                  <a className={styles.openLink} href={integrationsHref}>
                    Open Integrations settings
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </section>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.skipBtn}
                    onClick={onContinue}
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    className={styles.continueBtn}
                    onClick={onContinue}
                  >
                    Continue to dashboard
                  </button>
                </div>
              </motion.div>

              <aside className={styles.sidebar} aria-label="Quick start tips">
                <div className={styles.sidebarInner}>
                  <p className={styles.sidebarEyebrow}>Quick start tips</p>
                  <div className={styles.sidebarBlock}>
                    <h3 className={styles.sidebarTitle}>New here?</h3>
                    <p className={styles.sidebarText}>
                      Start with Stripe if you take online payments. Add Facebook
                      or Google when you’re ready to run ads.
                    </p>
                  </div>
                  <div className={styles.sidebarBlock}>
                    <h3 className={styles.sidebarTitle}>Stuck on login?</h3>
                    <p className={styles.sidebarText}>
                      Pop-ups may be blocked. Allow pop-ups for this site, or open
                      the connect link in a new tab when asked.
                    </p>
                  </div>
                  <div className={styles.sidebarBlock}>
                    <h3 className={styles.sidebarTitle}>Wrong account?</h3>
                    <p className={styles.sidebarText}>
                      Disconnect in Settings → Integrations, then connect again
                      with the correct account.
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
