import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Database,
  Lock,
  Megaphone,
  UserCheck,
} from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import {
  BRAND_COLORS,
  journeyStepSurface,
} from "@/app/components/landing/landing-brand";

const LANDING_LOGO_SRC = "/black-logo.png";
const LANDING_LOGO_WIDTH = 562;
const LANDING_LOGO_HEIGHT = 144;

const META_PERMISSIONS = [
  {
    permission: "ads_read",
    purpose:
      "Read campaign performance, delivery status, and ad account details so you can review results inside Dealioo.",
  },
  {
    permission: "ads_management",
    purpose:
      "Create, update, and publish ad campaigns, ad sets, creatives, and ads on your behalf through the Meta Marketing API.",
  },
  {
    permission: "public_profile",
    purpose:
      "Identify the Facebook user connecting the Meta Ads account to Dealioo.",
  },
] as const;

const META_DATA_COLLECTED = [
  {
    category: "Account & connection",
    items: [
      "Meta user ID (Facebook user who authorized the connection)",
      "OAuth access token (stored encrypted; used only to call Meta on your behalf)",
      "Granted permission scopes and token expiration time",
      "Connection status and connection timestamp",
      "Selected Meta ad account ID",
    ],
  },
  {
    category: "Advertising assets",
    items: [
      "Ad account names and IDs available to your Facebook user",
      "Campaign, ad set, ad, and creative IDs created or referenced through Dealioo",
      "Campaign setup fields you enter in our builder (budget, audience, schedule, creative text, media)",
    ],
  },
  {
    category: "Performance & diagnostics",
    items: [
      "Campaign and ad delivery metrics returned by Meta (e.g. spend, impressions, clicks)",
      "API error messages when publish or sync fails (to help you fix issues)",
      "Integration audit events (connection, disconnect, publish steps, tokens are never logged)",
    ],
  },
] as const;

const GOOGLE_PERMISSIONS = [
  {
    permission: "https://www.googleapis.com/auth/adwords",
    purpose:
      "Create, update, publish, and manage Google Ads campaigns, ad groups, keywords, and ads on your behalf through the Google Ads API.",
  },
  {
    permission: "https://www.googleapis.com/auth/tagmanager.readonly",
    purpose:
      "Read your Google Tag Manager container list so you can optionally pick containers when configuring Ads tracking in Dealioo.",
  },
  {
    permission: "openid, email, profile",
    purpose:
      "Identify the Google account connecting Google Ads to Dealioo and show which account is linked.",
  },
] as const;

const GOOGLE_DATA_COLLECTED = [
  {
    category: "Account & connection",
    items: [
      "Google user ID and email (from the Google account that authorized the connection)",
      "OAuth access and refresh tokens (stored encrypted; used only to call Google on your behalf)",
      "Granted OAuth scopes and token expiration time",
      "Connection status and connection timestamp",
      "Selected Google Ads customer ID and manager (login) customer ID when applicable",
    ],
  },
  {
    category: "Advertising assets",
    items: [
      "Google Ads customer accounts available to your Google login",
      "Campaign builder drafts you save in Dealioo (goals, budget, locations, keywords, ad copy, media)",
      "Campaign, ad group, ad, budget, and keyword IDs created or referenced after publish",
      "Publish job status and error messages when sync or publish fails",
    ],
  },
  {
    category: "Performance & diagnostics",
    items: [
      "Campaign metrics returned by Google Ads (e.g. spend, impressions, clicks)",
      "Conversion goal metadata from your linked Google Ads account",
      "Integration audit events (connection, disconnect, publish steps; tokens are never logged)",
    ],
  },
  {
    category: "Funnel conversion tracking (optional)",
    items: [
      "Google Ads tag ID (AW-…) and conversion labels you enter in Ads Tracking settings",
      "When guests arrive from Google Ads (gclid in the URL), funnel events such as page views, signups, and purchases may be stored in our database for reporting",
      "Browser conversion tags (gtag) may also fire on your public funnel pages when Ads Tracking is active",
    ],
  },
] as const;

function PrivacyBlock({
  icon: Icon,
  accent,
  title,
  children,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 border-b py-10 last:border-b-0 sm:grid-cols-[auto_1fr] sm:gap-8 sm:py-12"
      style={{ borderColor: "var(--landing-border)" }}
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ ...journeyStepSurface(accent), color: accent }}
        aria-hidden
      >
        <Icon className="size-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <h2 className="brand-landing-display text-xl font-semibold tracking-tight text-[var(--landing-text)] sm:text-2xl">
          {title}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#334155] sm:text-base sm:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function MetaPrivacyPolicyContent() {
  return (
    <div className="landing-page landing-page-shell min-h-dvh overflow-x-hidden">
      <AuthLandingNav />

      <main>
        <section className="landing-story-section bg-white pb-2 pt-[4.5rem] sm:pb-4 sm:pt-20">
          <div className="brand-landing-section mx-auto max-w-3xl">
            <PrivacyBlock
              icon={Megaphone}
              accent={BRAND_COLORS.blue}
              title="What Dealioo does"
            >
              <p>
                Dealioo is a business marketing platform. We help you run
                promotional campaigns, build signup funnels, track guests, and
                measure results. When you connect advertising platforms, we act
                as your authorized tool to manage ads and measure conversions.
              </p>
              <h3 className="pt-2 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Meta (Facebook & Instagram Ads)
              </h3>
              <p>
                When you connect Meta, we use the{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Meta Marketing API
                </strong>{" "}
                (Facebook Graph API v24.0) to:
              </p>
              <ul className="space-y-2">
                {[
                  "Connect your Facebook account via secure OAuth login",
                  "Let you pick a Meta ad account",
                  "Build and publish campaigns, ad sets, creatives, and ads from our campaign builder",
                  "Display campaign stats and publish status inside your dashboard",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full"
                      style={{ background: BRAND_COLORS.blue }}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <h3 className="pt-4 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Google Ads
              </h3>
              <p>
                When you connect Google Ads, we use the{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Google Ads API
                </strong>{" "}
                and related Google OAuth services to:
              </p>
              <ul className="space-y-2">
                {[
                  "Connect your Google account via secure OAuth login",
                  "Let you pick a Google Ads customer account",
                  "Build campaign drafts in our Google campaign builder and publish campaigns, ad groups, keywords, and responsive search ads to Google Ads",
                  "Display campaign performance (spend, impressions, clicks) in your Dealioo dashboard",
                  "Optionally configure a Google Ads conversion tag (AW-…) on your funnel and store ad-attributed funnel events when guests click your Google ads",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full"
                      style={{ background: BRAND_COLORS.green }}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Database}
              accent={BRAND_COLORS.green}
              title="Data we receive from Meta & Google"
            >
              <p>
                We only request data needed to connect advertising and show
                results. We do{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  not
                </strong>{" "}
                sell your Meta or Google data to third parties.
              </p>
              <h3 className="pt-2 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Meta
              </h3>
              <div className="space-y-6 pt-1">
                {META_DATA_COLLECTED.map((group) => (
                  <div key={`meta-${group.category}`}>
                    <h4 className="text-sm font-semibold text-[var(--landing-text)]">
                      {group.category}
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span
                            className="mt-1.5 shrink-0 text-sm font-bold"
                            style={{ color: BRAND_COLORS.green }}
                            aria-hidden
                          >
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <h3 className="pt-6 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Google Ads
              </h3>
              <div className="space-y-6 pt-1">
                {GOOGLE_DATA_COLLECTED.map((group) => (
                  <div key={`google-${group.category}`}>
                    <h4 className="text-sm font-semibold text-[var(--landing-text)]">
                      {group.category}
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span
                            className="mt-1.5 shrink-0 text-sm font-bold"
                            style={{ color: BRAND_COLORS.green }}
                            aria-hidden
                          >
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </PrivacyBlock>

            <PrivacyBlock
              icon={UserCheck}
              accent={BRAND_COLORS.violet}
              title="Permissions we request"
            >
              <p>
                When you connect an ad platform, you see a consent screen from
                that provider. You can revoke access anytime by disconnecting in
                Dealioo or in your Meta / Google account settings.
              </p>
              <h3 className="pt-2 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Meta permissions
              </h3>
              <div
                className="mt-3 overflow-hidden rounded-[1.25rem] border bg-[var(--landing-bg-subtle)]"
                style={{ borderColor: "var(--landing-border)" }}
              >
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      className="text-xs font-bold uppercase tracking-[0.14em]"
                      style={{ color: BRAND_COLORS.blue }}
                    >
                      <th className="px-4 py-3 sm:px-5">Permission</th>
                      <th className="px-4 py-3 sm:px-5">Why we need it</th>
                    </tr>
                  </thead>
                  <tbody>
                    {META_PERMISSIONS.map((row) => (
                      <tr
                        key={row.permission}
                        className="border-t bg-white"
                        style={{ borderColor: "var(--landing-border)" }}
                      >
                        <td className="px-4 py-3.5 align-top font-mono text-xs font-semibold text-[var(--landing-text)] sm:px-5">
                          {row.permission}
                        </td>
                        <td className="px-4 py-3.5 text-[#334155] sm:px-5">
                          {row.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="pt-6 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Google OAuth scopes
              </h3>
              <div
                className="mt-3 overflow-hidden rounded-[1.25rem] border bg-[var(--landing-bg-subtle)]"
                style={{ borderColor: "var(--landing-border)" }}
              >
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      className="text-xs font-bold uppercase tracking-[0.14em]"
                      style={{ color: BRAND_COLORS.green }}
                    >
                      <th className="px-4 py-3 sm:px-5">Scope</th>
                      <th className="px-4 py-3 sm:px-5">Why we need it</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GOOGLE_PERMISSIONS.map((row) => (
                      <tr
                        key={row.permission}
                        className="border-t bg-white"
                        style={{ borderColor: "var(--landing-border)" }}
                      >
                        <td className="px-4 py-3.5 align-top font-mono text-xs font-semibold text-[var(--landing-text)] sm:px-5">
                          {row.permission}
                        </td>
                        <td className="px-4 py-3.5 text-[#334155] sm:px-5">
                          {row.purpose}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PrivacyBlock>

            <PrivacyBlock
              icon={BarChart3}
              accent={BRAND_COLORS.orange}
              title="How we use this data"
            >
              <ul className="space-y-2.5">
                {[
                  ["Operate the integration", "authenticate API calls, refresh OAuth tokens, and keep your Meta or Google connection healthy."],
                  ["Publish your ads", "send campaign setup you configure in our builders to Meta or Google Ads (campaigns, ad sets, creatives, keywords, and ads)."],
                  ["Show performance", "display spend, delivery, clicks, and status in your Dealioo dashboard."],
                  ["Measure funnel conversions", "when Ads Tracking is enabled, record ad-attributed funnel events and load conversion tags on your public funnel pages."],
                  ["Support & troubleshooting", "diagnose publish failures and integration errors (without logging access tokens)."],
                  ["Security & compliance", "audit connection events and protect against unauthorized access."],
                ].map(([label, rest]) => (
                  <li key={label}>
                    <strong className="font-semibold text-[var(--landing-text)]">
                      {label}
                    </strong>
                    , {rest}
                  </li>
                ))}
              </ul>
              <p>
                We do not use Meta or Google data for unrelated advertising,
                profiling, or resale. Campaign content is used only to deliver the
                ads you explicitly configure.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Lock}
              accent={BRAND_COLORS.blue}
              title="Security & storage"
            >
              <ul className="space-y-2">
                <li>
                  Meta and Google OAuth tokens are encrypted at rest in our
                  database.
                </li>
                <li>
                  Tokens are transmitted only over HTTPS to Meta&apos;s Graph API
                  or Google&apos;s OAuth and Google Ads APIs.
                </li>
                <li>Audit logs exclude secrets, tokens, and passwords.</li>
                <li>
                  Only authorized business admins can connect or disconnect Meta
                  or Google Ads for their account.
                </li>
              </ul>
            </PrivacyBlock>
          </div>
        </section>
      </main>

      <footer className="landing-footer relative z-10 border-t py-10 sm:py-12">
        <div className="brand-landing-section flex flex-col gap-8 sm:gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <DealiooLogo
              src={LANDING_LOGO_SRC}
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              variant="light"
              className="h-8 w-auto"
            />
            <p className="landing-text-muted mt-3 text-sm leading-relaxed">
              The AI platform that helps businesses turn ad clicks into repeat
              customers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            <div>
              <p className="landing-footer-title text-sm font-semibold">Legal</p>
              <ul className="landing-text-muted mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="transition hover:text-brand-primary"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="landing-footer-title text-sm font-semibold">
                Account
              </p>
              <ul className="landing-text-muted mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/auth/login"
                    className="transition hover:text-brand-primary"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/signup"
                    className="transition hover:text-brand-primary"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div
          className="landing-text-muted brand-landing-section mt-10 border-t pt-6 text-center text-xs"
          style={{ borderColor: "var(--landing-border)" }}
        >
          © {new Date().getFullYear()} Dealioo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
