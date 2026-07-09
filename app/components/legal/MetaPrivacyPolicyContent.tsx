import Link from "next/link";
import {
  BarChart3,
  Database,
  Lock,
  Megaphone,
  Shield,
  Unplug,
  UserCheck,
} from "lucide-react";
import { PrivacyPolicyUrlBanner } from "@/app/components/legal/PrivacyPolicyUrlBanner";
import { getPublicPrivacyPolicyUrl } from "@/app/lib/public-app-url";

const LAST_UPDATED = "June 23, 2026";

const META_PERMISSIONS = [
  {
    permission: "ads_management",
    purpose:
      "Create, update, and publish ad campaigns, ad sets, creatives, and ads on your behalf through the Meta Marketing API.",
  },
  {
    permission: "ads_read",
    purpose:
      "Read campaign performance, delivery status, and ad account details so you can review results inside Dealioo.",
  },
  {
    permission: "business_management",
    purpose:
      "Access the Meta Business assets (ad accounts) linked to your Facebook login so you can choose which account to use.",
  },
  {
    permission: "pages_show_list",
    purpose:
      "List Facebook Pages you manage so you can select the correct Page when building ad creatives.",
  },
  {
    permission: "pages_read_engagement",
    purpose:
      "Associate your Facebook Page with ads and read basic Page information required for ad delivery.",
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
      "Facebook Page IDs and names you can access",
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

export function MetaPrivacyPolicyContent() {
  const privacyUrl = getPublicPrivacyPolicyUrl();

  return (
    <div className="min-h-dvh bg-[#f4f6f8]">
      <div className="relative overflow-hidden border-b border-zinc-200/80 bg-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-20%,rgba(24,119,242,0.12),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-[0_8px_24px_rgba(24,119,242,0.35)]"
              aria-hidden
            >
              <Shield className="size-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
                Dealioo, Meta integration
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                Privacy Policy
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            This policy explains how <strong className="font-semibold text-zinc-800">Dealioo</strong>{" "}
            uses Meta (Facebook) when business owners connect their accounts,
            build campaigns, and publish ads. It is written in plain language so
            you know exactly what we do and what data we handle.
          </p>
          <p className="mt-3 text-xs text-zinc-500">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <PrivacyPolicyUrlBanner privacyUrl={privacyUrl} />

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 size-5 shrink-0 text-[#1877F2]" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">What Dealioo does</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Dealioo is a business marketing platform. We help you run
                promotional campaigns, build signup funnels, track guests, and
                measure results. When you connect Meta, we act as your authorized
                tool to manage advertising through the{" "}
                <strong className="font-medium text-zinc-800">Meta Marketing API</strong>{" "}
                (Facebook Graph API v23.0), the same infrastructure Meta Ads
                Manager uses.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li className="flex gap-2">
                  <span className="text-[#1877F2]">•</span>
                  <span>Connect your Facebook account via secure OAuth login</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1877F2]">•</span>
                  <span>Let you pick a Meta ad account and Facebook Page</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1877F2]">•</span>
                  <span>Build and publish campaigns, ad sets, creatives, and ads from our campaign builder</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1877F2]">•</span>
                  <span>Display campaign stats and publish status inside your dashboard</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Data we receive from Meta</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                We only request data needed to connect advertising and show
                results. We do <strong className="font-medium text-zinc-800">not</strong> sell
                your Meta data to third parties.
              </p>
              <div className="mt-6 space-y-5">
                {META_DATA_COLLECTED.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-sm font-semibold text-zinc-800">{group.category}</h3>
                    <ul className="mt-2 space-y-1.5">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-sm leading-relaxed text-zinc-600"
                        >
                          <span className="text-emerald-600">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 size-5 shrink-0 text-violet-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-zinc-900">Permissions we request</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                When you click Connect Facebook, Meta shows you these permissions.
                You can revoke them anytime by disconnecting in Dealioo or in your
                Facebook settings.
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Permission</th>
                      <th className="px-4 py-3">Why we need it</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {META_PERMISSIONS.map((row) => (
                      <tr key={row.permission} className="bg-white">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-zinc-800">
                          {row.permission}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{row.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">How we use this data</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600">
                <li>
                  <strong className="font-medium text-zinc-800">Operate the integration</strong>,{" "}
                  authenticate API calls, refresh tokens, and keep your connection healthy.
                </li>
                <li>
                  <strong className="font-medium text-zinc-800">Publish your ads</strong>,{" "}
                  send campaign, ad set, creative, and ad payloads you configure in our builder to Meta.
                </li>
                <li>
                  <strong className="font-medium text-zinc-800">Show performance</strong>,{" "}
                  display spend, delivery, and status in your Dealioo dashboard.
                </li>
                <li>
                  <strong className="font-medium text-zinc-800">Support & troubleshooting</strong>,{" "}
                  diagnose publish failures and integration errors (without logging access tokens).
                </li>
                <li>
                  <strong className="font-medium text-zinc-800">Security & compliance</strong>,{" "}
                  audit connection events and protect against unauthorized access.
                </li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                We do not use Meta data for unrelated advertising, profiling, or
                resale. Campaign content (images, copy, targeting) is used only to
                deliver the ads you explicitly configure.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-zinc-700" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Security & storage</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600">
                <li>Meta access tokens are encrypted at rest in our database.</li>
                <li>Tokens are transmitted only over HTTPS to Meta&apos;s Graph API.</li>
                <li>Audit logs exclude secrets, tokens, and passwords.</li>
                <li>Only authorized business admins can connect or disconnect Meta for their account.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <Unplug className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Disconnect & delete your data</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                You can disconnect Meta at any time from{" "}
                <strong className="font-medium text-zinc-800">Settings → Integrations</strong>{" "}
                in Dealioo. When you disconnect:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>We remove your stored access token and clear the ad account selection.</li>
                <li>We stop making Marketing API calls on your behalf.</li>
                <li>Existing campaigns in Meta Ads Manager remain in Meta, we do not delete live ads unless you delete them in Meta.</li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                You can also remove Dealioo from your Facebook account under{" "}
                <strong className="font-medium text-zinc-800">Facebook → Settings → Business integrations</strong>.
                For data deletion requests, contact us at{" "}
                <a
                  href="mailto:support@dealioo.com"
                  className="font-medium text-[#1877F2] underline underline-offset-2"
                >
                  support@dealioo.com
                </a>.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900">Other platform data (brief)</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Beyond Meta, Dealioo collects guest signup data (name, email, phone)
            through business funnels, payment details processed by Stripe (we do
            not store full card numbers), and business account information you
            provide when registering. That data is separate from Meta and is used
            to run campaigns, passes, and retention features for your business.
          </p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm text-zinc-600">
            Questions about this policy or your Meta connection?
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@dealioo.com"
              className="inline-flex rounded-xl bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166FE0]"
            >
              Contact support
            </a>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Back to Dealioo
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Meta, Facebook, and Meta Ads Manager are trademarks of Meta Platforms, Inc.
          Dealioo is not affiliated with or endorsed by Meta.
        </p>
      </div>
    </div>
  );
}
