import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Cookie,
  Database,
  Globe2,
  Lock,
  Mail,
  Megaphone,
  Scale,
  Shield,
  Trash2,
  UserCheck,
  Users,
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

const PRIVACY_CONTACT_EMAIL = "support@dealioo.com";
const PRIVACY_CONTACT_MAILTO = `mailto:${PRIVACY_CONTACT_EMAIL}`;
const LAST_UPDATED = "September 22, 2026";

const META_PERMISSIONS = [
  {
    permission: "ads_read",
    purpose:
      "Read campaign performance, delivery status, and ad account details so you can review results inside Dealioo.",
  },
  {
    permission: "ads_management",
    purpose:
      "Create, read, delete, and publish ad campaigns, ad sets, creatives, and ads on your behalf through the Meta Marketing API.",
  },
  {
    permission: "pages_show_list",
    purpose:
      "List Facebook Pages you manage so you can choose which Page will run your ads. Requested with ads_management.",
  },
  {
    permission: "pages_read_engagement",
    purpose:
      "Read the Facebook Page you select (name, picture, about, category, and contact details) so you can verify the correct Page will represent your ads in Dealioo before publishing. Requested with ads_management.",
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
      "Integration audit events (connection, disconnect, publish steps; tokens are never logged)",
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

const GENERAL_DATA_COLLECTED = [
  {
    category: "Account information",
    items: [
      "Name, email address, and login credentials associated with your Dealioo account",
      "Role and membership details when you join or manage a business workspace",
    ],
  },
  {
    category: "Business information",
    items: [
      "Business name, contact details, branding assets (such as logos), and setup preferences",
      "Campaign and funnel configuration you create in Dealioo",
    ],
  },
  {
    category: "Customer / guest data",
    items: [
      "Guest names, emails, phone numbers, and other details you or your funnels collect",
      "Visit, redemption, and engagement history tied to your campaigns",
    ],
  },
  {
    category: "Funnel submissions",
    items: [
      "Information guests submit on landing, signup, payment, and confirmation pages",
      "Funnel analytics events such as page views and conversion steps",
    ],
  },
  {
    category: "Orders and payment-related data",
    items: [
      "Order and payment status records needed to operate prepaid/postpaid offers",
      "Payment metadata returned by Stripe (Dealioo does not store full card numbers)",
    ],
  },
  {
    category: "Device, browser, and technical data",
    items: [
      "IP address, browser type, device information, and approximate location derived from connection data when needed for security, fraud prevention, or service operation",
      "Log and diagnostic data related to app usage and errors",
    ],
  },
  {
    category: "Cookies and analytics",
    items: [
      "Cookies and similar technologies used for authentication, session continuity, preferences, and product analytics",
      "Usage metrics that help us understand how Dealioo is used and improve the product",
    ],
  },
  {
    category: "Support messages",
    items: [
      "Messages, attachments, and contact details you send when requesting help or reporting issues",
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
    <div
      className="grid gap-5 border-b py-10 last:border-b-0 sm:grid-cols-[auto_1fr] sm:gap-8 sm:py-12"
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

function BulletList({
  items,
  accent = BRAND_COLORS.blue,
}: {
  items: readonly string[];
  accent?: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            className="mt-2 size-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckList({
  items,
  accent = BRAND_COLORS.green,
}: {
  items: readonly string[];
  accent?: string;
}) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            className="mt-1.5 shrink-0 text-sm font-bold"
            style={{ color: accent }}
            aria-hidden
          >
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ScopeTable({
  rows,
  firstColumnLabel,
  accent,
}: {
  rows: readonly { permission: string; purpose: string }[];
  firstColumnLabel: string;
  accent: string;
}) {
  return (
    <div
      className="mt-3 overflow-hidden rounded-[1.25rem] border bg-[var(--landing-bg-subtle)]"
      style={{ borderColor: "var(--landing-border)" }}
    >
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">
          {firstColumnLabel} and why we need it
        </caption>
        <thead>
          <tr
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: accent }}
          >
            <th scope="col" className="w-[38%] px-4 py-3 sm:px-5">
              {firstColumnLabel}
            </th>
            <th scope="col" className="w-[62%] px-4 py-3 sm:px-5">
              Why we need it
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.permission}
              className="border-t bg-white"
              style={{ borderColor: "var(--landing-border)" }}
            >
              <td className="break-words px-4 py-3.5 align-top font-mono text-xs font-semibold text-[var(--landing-text)] sm:px-5">
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
  );
}

export function MetaPrivacyPolicyContent() {
  return (
    <div className="landing-page landing-page-shell min-h-dvh overflow-x-hidden">
      <AuthLandingNav />

      <main>
        <section className="landing-story-section bg-white pb-2 pt-[4.5rem] sm:pb-4 sm:pt-20">
          <div className="brand-landing-section mx-auto max-w-3xl">
            <header className="border-b pb-8 sm:pb-10" style={{ borderColor: "var(--landing-border)" }}>
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: BRAND_COLORS.blue }}
              >
                Legal
              </p>
              <h1 className="brand-landing-display mt-2 text-3xl font-semibold tracking-tight text-[var(--landing-text)] sm:text-4xl">
                Dealioo Privacy Policy
              </h1>
              <p className="mt-3 text-sm text-[#64748b] sm:text-base">
                Last updated: {LAST_UPDATED}
              </p>
            </header>

            <PrivacyBlock
              icon={Megaphone}
              accent={BRAND_COLORS.blue}
              title="1. Introduction"
            >
              <p>
                This Privacy Policy explains how Dealioo collects, uses, shares,
                and protects personal information when you use our websites,
                apps, and related services (together, “Dealioo”).
              </p>
              <h3 className="pt-2 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Who operates Dealioo
              </h3>
              <p>
                Dealioo is operated by <strong className="font-semibold text-[var(--landing-text)]">Dealioo</strong>.
                For privacy questions or requests, contact us at{" "}
                <a
                  href={PRIVACY_CONTACT_MAILTO}
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2 hover:decoration-brand-primary"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                .
              </p>
              <p>
                Dealioo is a business marketing platform. We help you run
                promotional campaigns, build signup funnels, track guests,
                process offer-related payments, and measure results. When you
                connect advertising or other platforms, we act as your
                authorized tool to manage those integrations.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Database}
              accent={BRAND_COLORS.green}
              title="2. Information we collect"
            >
              <p>
                Depending on how you use Dealioo, we may collect the following
                categories of information:
              </p>
              <div className="space-y-6 pt-1">
                {GENERAL_DATA_COLLECTED.map((group) => (
                  <div key={group.category}>
                    <h4 className="text-sm font-semibold text-[var(--landing-text)]">
                      {group.category}
                    </h4>
                    <CheckList items={group.items} />
                  </div>
                ))}
              </div>
            </PrivacyBlock>

            <PrivacyBlock
              icon={BarChart3}
              accent={BRAND_COLORS.orange}
              title="3. How we use information"
            >
              <p>We use personal information to:</p>
              <ul className="space-y-2.5">
                {[
                  [
                    "Operate accounts",
                    "create and manage user accounts, business workspaces, roles, and access.",
                  ],
                  [
                    "Run funnels and campaigns",
                    "host and deliver your promotional funnels, campaigns, and related guest experiences.",
                  ],
                  [
                    "Process orders",
                    "support prepaid and postpaid offer flows, order records, and payment status with Stripe.",
                  ],
                  [
                    "Provide analytics",
                    "show performance, conversion, and engagement reporting in your dashboard.",
                  ],
                  [
                    "Customer support",
                    "respond to questions, troubleshoot issues, and improve reliability.",
                  ],
                  [
                    "Security",
                    "authenticate users, prevent abuse, detect fraud, and protect the platform.",
                  ],
                ].map(([label, rest]) => (
                  <li key={label}>
                    <strong className="font-semibold text-[var(--landing-text)]">
                      {label}
                    </strong>
                    , {rest}
                  </li>
                ))}
              </ul>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Megaphone}
              accent={BRAND_COLORS.blue}
              title="4. Meta Ads integration"
            >
              <h3 className="text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                What we do with Meta
              </h3>
              <p>
                When you connect Meta, we use the{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Meta Marketing API (Facebook Graph API)
                </strong>{" "}
                to:
              </p>
              <BulletList
                accent={BRAND_COLORS.blue}
                items={[
                  "Connect your Facebook account via secure OAuth login",
                  "Let you pick a Meta ad account",
                  "Build and publish campaigns, ad sets, creatives, and ads from our campaign builder",
                  "Display campaign stats and publish status inside your dashboard",
                ]}
              />

              <h3 className="pt-4 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Data we receive from Meta
              </h3>
              <p>
                We only request data needed to connect advertising and show
                results. We do{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  not
                </strong>{" "}
                sell your Meta data to third parties.
              </p>
              <div className="space-y-6 pt-1">
                {META_DATA_COLLECTED.map((group) => (
                  <div key={`meta-${group.category}`}>
                    <h4 className="text-sm font-semibold text-[var(--landing-text)]">
                      {group.category}
                    </h4>
                    <CheckList items={group.items} />
                  </div>
                ))}
              </div>

              <h3 className="pt-4 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Meta permissions
              </h3>
              <p>
                When you connect Meta, you see Meta’s consent screen. You can
                revoke access anytime by disconnecting in Dealioo or in your
                Meta account settings.
              </p>
              <ScopeTable
                rows={META_PERMISSIONS}
                firstColumnLabel="Permission"
                accent={BRAND_COLORS.blue}
              />

              <p className="rounded-xl border border-[#dbe7ff] bg-[#f4f8ff] px-3.5 py-3 text-sm text-[#1e3a5f]">
                Disconnecting an advertising platform stops Dealioo from making
                future API requests. Users may separately request deletion of
                previously stored integration data.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Megaphone}
              accent={BRAND_COLORS.green}
              title="5. Google Ads integration"
            >
              <h3 className="text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                What we do with Google Ads
              </h3>
              <p>
                When you connect Google Ads, we use the{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Google Ads API
                </strong>{" "}
                and related Google OAuth services to:
              </p>
              <BulletList
                accent={BRAND_COLORS.green}
                items={[
                  "Connect your Google account via secure OAuth login",
                  "Let you pick a Google Ads customer account",
                  "Build campaign drafts in our Google campaign builder and publish campaigns, ad groups, keywords, and responsive search ads to Google Ads",
                  "Display campaign performance (spend, impressions, clicks) in your Dealioo dashboard",
                  "Optionally configure a Google Ads conversion tag (AW-…) on your funnel and store ad-attributed funnel events when guests click your Google ads",
                ]}
              />

              <h3 className="pt-4 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Data we receive from Google
              </h3>
              <p>
                We only request data needed to connect advertising and show
                results. We do{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  not
                </strong>{" "}
                sell your Google data to third parties.
              </p>
              <div className="space-y-6 pt-1">
                {GOOGLE_DATA_COLLECTED.map((group) => (
                  <div key={`google-${group.category}`}>
                    <h4 className="text-sm font-semibold text-[var(--landing-text)]">
                      {group.category}
                    </h4>
                    <CheckList items={group.items} />
                  </div>
                ))}
              </div>

              <h3 className="pt-4 text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                Google OAuth scopes
              </h3>
              <p>
                When you connect Google Ads, you see Google’s consent screen.
                You can revoke access anytime by disconnecting in Dealioo or in
                your Google account settings.
              </p>
              <ScopeTable
                rows={GOOGLE_PERMISSIONS}
                firstColumnLabel="Scope"
                accent={BRAND_COLORS.green}
              />

              <p className="rounded-xl border border-[#dcfce7] bg-[#f0fdf4] px-3.5 py-3 text-sm text-[#14532d]">
                Disconnecting an advertising platform stops Dealioo from making
                future API requests. Users may separately request deletion of
                previously stored integration data.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Shield}
              accent={BRAND_COLORS.violet}
              title="6. Payments and other integrations"
            >
              <p>
                Depending on your setup, Dealioo may also process information
                through these providers:
              </p>
              <ul className="space-y-2.5">
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Stripe
                  </strong>
                  {" — "}
                  payment processing for connected businesses, checkout sessions,
                  and payment status. Card details are handled by Stripe; Dealioo
                  stores payment metadata needed for orders and reporting.
                </li>
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Twilio
                  </strong>
                  {" — "}
                  messaging and communications features when you connect a Twilio
                  account (for example, SMS-related workflows).
                </li>
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Hosting and cloud providers
                  </strong>
                  {" — "}
                  infrastructure used to host Dealioo, store application data,
                  and deliver media/assets.
                </li>
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Analytics providers
                  </strong>
                  {" — "}
                  product and advertising analytics tools you enable (including
                  Meta and Google tracking where configured on your funnels).
                </li>
              </ul>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Users}
              accent={BRAND_COLORS.blue}
              title="7. How we share information"
            >
              <p>
                Dealioo only shares information with service providers when
                required to operate the platform, process payments, send
                communications, host infrastructure, provide advertising
                integrations, or meet legal obligations.
              </p>
              <p>
                We do not sell personal information. We may also disclose
                information if required by law, to protect Dealioo or our users,
                or in connection with a business transfer (such as a merger or
                acquisition), subject to appropriate safeguards.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Scale}
              accent={BRAND_COLORS.orange}
              title="8. Data retention"
            >
              <p>
                We retain personal information for as long as needed to provide
                Dealioo, maintain your account and business records, meet legal
                and accounting requirements, resolve disputes, and enforce our
                agreements.
              </p>
              <p>
                Retention periods vary by data type. For example, account and
                business records are typically kept while your account remains
                active; order and payment records may be retained longer where
                required for financial or legal compliance; support tickets and
                logs may be kept for a limited period for security and
                troubleshooting. When information is no longer needed, we delete
                or de-identify it according to our operational practices.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Lock}
              accent={BRAND_COLORS.blue}
              title="9. Security"
            >
              <BulletList
                items={[
                  "Meta and Google OAuth tokens are encrypted at rest in our database.",
                  "Tokens are transmitted only over HTTPS to Meta’s Graph API or Google’s OAuth and Google Ads APIs.",
                  "Audit logs exclude secrets, tokens, and passwords.",
                  "Only authorized business admins can connect or disconnect Meta or Google Ads for their account.",
                  "We use access controls, encrypted transport, and monitoring practices designed to protect personal information.",
                ]}
              />
              <p>
                No method of transmission or storage is 100% secure. If you
                believe your account has been compromised, contact us promptly
                at{" "}
                <a
                  href={PRIVACY_CONTACT_MAILTO}
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                .
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={UserCheck}
              accent={BRAND_COLORS.violet}
              title="10. Your privacy rights"
            >
              <p>
                Depending on your location and applicable law, you may have
                rights to:
              </p>
              <BulletList
                accent={BRAND_COLORS.violet}
                items={[
                  "Access the personal information we hold about you",
                  "Correct inaccurate or incomplete personal information",
                  "Request deletion of personal information",
                  "Export or receive a copy of certain personal information, where applicable",
                ]}
              />
              <p>
                To exercise these rights, contact{" "}
                <a
                  href={PRIVACY_CONTACT_MAILTO}
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>
                . We may need to verify your identity before completing a
                request.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Trash2}
              accent={BRAND_COLORS.orange}
              title="11. Data deletion"
            >
              <p>
                To request deletion of your personal information or advertising
                integration data, contact{" "}
                <a
                  href={PRIVACY_CONTACT_MAILTO}
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>{" "}
                or use the account deletion controls available in Dealioo where
                offered.
              </p>
              <p>
                <strong className="font-semibold text-[var(--landing-text)]">
                  Important:
                </strong>{" "}
                Disconnecting Meta or Google stops Dealioo from making future
                API requests to that platform. Disconnecting does{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  not
                </strong>{" "}
                automatically delete all historical stored data (such as past
                campaign IDs, performance snapshots, or audit records). To remove
                previously stored integration data, submit a separate deletion
                request.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Cookie}
              accent={BRAND_COLORS.green}
              title="12. Cookies and tracking technologies"
            >
              <p>
                Dealioo uses cookies and similar technologies to keep you signed
                in, remember preferences, secure the service, and understand
                product usage. Businesses may also enable advertising or
                conversion tags (for example Meta Pixel or Google Ads tags) on
                public funnel pages; those technologies are controlled by the
                settings you configure and by the policies of those providers.
              </p>
              <p>
                You can control cookies through your browser settings. Disabling
                certain cookies may affect how Dealioo works (for example,
                staying logged in).
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Globe2}
              accent={BRAND_COLORS.blue}
              title="13. International data transfers"
            >
              <p>
                Dealioo may be accessed by users in more than one country.
                Personal information may be processed and stored in locations
                where we or our service providers operate. When we transfer
                personal information across borders, we take steps designed to
                protect it in accordance with this Privacy Policy and applicable
                law.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Users}
              accent={BRAND_COLORS.violet}
              title="14. Children’s privacy"
            >
              <p>
                Dealioo is intended for business use and is not directed to
                children under 13 (or the minimum age required by local law). We
                do not knowingly collect personal information from children. If
                you believe a child has provided personal information to us,
                contact{" "}
                <a
                  href={PRIVACY_CONTACT_MAILTO}
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                >
                  {PRIVACY_CONTACT_EMAIL}
                </a>{" "}
                and we will take appropriate steps to delete it.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Scale}
              accent={BRAND_COLORS.orange}
              title="15. Changes to this Privacy Policy"
            >
              <p>
                We may update this Privacy Policy from time to time. When we do,
                we will revise the “Last updated” date at the top of this page.
                If changes are material, we may provide additional notice (for
                example, in-product notice or email). Continued use of Dealioo
                after an update means you acknowledge the revised policy.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Mail}
              accent={BRAND_COLORS.blue}
              title="16. Contact us"
            >
              <p>
                If you have questions about this Privacy Policy, or want to
                exercise privacy rights or request deletion, contact:
              </p>
              <ul className="space-y-1.5">
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Operator:
                  </strong>{" "}
                  Dealioo
                </li>
                <li>
                  <strong className="font-semibold text-[var(--landing-text)]">
                    Privacy email:
                  </strong>{" "}
                  <a
                    href={PRIVACY_CONTACT_MAILTO}
                    className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                  >
                    {PRIVACY_CONTACT_EMAIL}
                  </a>
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
                <li>
                  <Link
                    href="/terms"
                    className="transition hover:text-brand-primary"
                  >
                    Terms of Service
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
