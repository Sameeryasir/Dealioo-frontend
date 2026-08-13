import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Database,
  Lock,
  Megaphone,
  Unplug,
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
        <section className="bg-white pt-[4.5rem] pb-6 sm:pt-20 sm:pb-8">
          <div className="brand-landing-section">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 text-center sm:gap-4">
              <DealiooLogo
                src={LANDING_LOGO_SRC}
                width={LANDING_LOGO_WIDTH}
                height={LANDING_LOGO_HEIGHT}
                variant="light"
                className="h-9 w-auto sm:h-11"
                priority
              />
              <h1 className="brand-landing-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Privacy{" "}
                <span className="landing-hero-accent-pink">Policy</span>
              </h1>
            </div>
          </div>
        </section>

        <section className="landing-story-section bg-white py-2 sm:py-4">
          <div className="brand-landing-section mx-auto max-w-3xl">
            <PrivacyBlock
              icon={Megaphone}
              accent={BRAND_COLORS.blue}
              title="What Dealioo does"
            >
              <p>
                Dealioo is a business marketing platform. We help you run
                promotional campaigns, build signup funnels, track guests, and
                measure results. When you connect Meta, we act as your
                authorized tool to manage advertising through the{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Meta Marketing API
                </strong>{" "}
                (Facebook Graph API v24.0).
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
            </PrivacyBlock>

            <PrivacyBlock
              icon={Database}
              accent={BRAND_COLORS.green}
              title="Data we receive from Meta"
            >
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
                  <div key={group.category}>
                    <h3 className="text-sm font-semibold text-[var(--landing-text)] sm:text-base">
                      {group.category}
                    </h3>
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
                When you click Connect Facebook, Meta shows you these
                permissions. You can revoke them anytime by disconnecting in
                Dealioo or in your Facebook settings.
              </p>
              <div
                className="mt-4 overflow-hidden rounded-[1.25rem] border bg-[var(--landing-bg-subtle)]"
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
            </PrivacyBlock>

            <PrivacyBlock
              icon={BarChart3}
              accent={BRAND_COLORS.orange}
              title="How we use this data"
            >
              <ul className="space-y-2.5">
                {[
                  ["Operate the integration", "authenticate API calls, refresh tokens, and keep your connection healthy."],
                  ["Publish your ads", "send campaign, ad set, creative, and ad payloads you configure in our builder to Meta."],
                  ["Show performance", "display spend, delivery, and status in your Dealioo dashboard."],
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
                We do not use Meta data for unrelated advertising, profiling, or
                resale. Campaign content is used only to deliver the ads you
                explicitly configure.
              </p>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Lock}
              accent={BRAND_COLORS.blue}
              title="Security & storage"
            >
              <ul className="space-y-2">
                <li>Meta access tokens are encrypted at rest in our database.</li>
                <li>
                  Tokens are transmitted only over HTTPS to Meta&apos;s Graph
                  API.
                </li>
                <li>Audit logs exclude secrets, tokens, and passwords.</li>
                <li>
                  Only authorized business admins can connect or disconnect Meta
                  for their account.
                </li>
              </ul>
            </PrivacyBlock>

            <PrivacyBlock
              icon={Unplug}
              accent={BRAND_COLORS.pink}
              title="Disconnect & delete your data"
            >
              <p>
                You can disconnect Meta at any time from{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Settings → Integrations
                </strong>{" "}
                in Dealioo. When you disconnect:
              </p>
              <ul className="space-y-2">
                <li>
                  We remove your stored access token and clear the ad account
                  selection.
                </li>
                <li>We stop making Marketing API calls on your behalf.</li>
                <li>
                  Existing campaigns in Meta Ads Manager remain in Meta; we do
                  not delete live ads unless you delete them in Meta.
                </li>
              </ul>
              <p>
                You can also remove Dealioo from your Facebook account under{" "}
                <strong className="font-semibold text-[var(--landing-text)]">
                  Facebook → Settings → Business integrations
                </strong>
                . For data deletion requests, contact us through Dealioo
                support.
              </p>
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
