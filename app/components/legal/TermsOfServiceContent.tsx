"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { BRAND_COLORS } from "@/app/components/landing/landing-brand";

const LANDING_LOGO_SRC = "/black-logo.png";
const LANDING_LOGO_WIDTH = 562;
const LANDING_LOGO_HEIGHT = 144;

const SUPPORT_EMAIL = "support@dealioo.com";
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
const LAST_UPDATED = "September 22, 2026";

const TOC = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "about", label: "2. About Dealioo" },
  { id: "eligibility", label: "3. Eligibility and Business Use" },
  { id: "account", label: "4. Account Registration and Security" },
  { id: "team", label: "5. Business Accounts and Team Members" },
  { id: "billing", label: "6. Subscription Plans and Billing" },
  { id: "payments", label: "7. Payments and Stripe" },
  { id: "promotions", label: "8. Promotions, Rewards and Offers" },
  { id: "meta", label: "9. Meta Advertising Integration" },
  { id: "google", label: "10. Google Ads Integration" },
  { id: "ad-spend", label: "11. Advertising Spend" },
  { id: "messaging", label: "12. Messaging and Twilio" },
  { id: "guest-data", label: "13. Customer and Guest Data" },
  { id: "third-party", label: "14. Third-Party Services" },
  { id: "acceptable-use", label: "15. Acceptable Use" },
  { id: "ai", label: "16. AI-Assisted Features" },
  { id: "user-content", label: "17. User Content" },
  { id: "ip", label: "18. Dealioo Intellectual Property" },
  { id: "availability", label: "19. Service Availability" },
  { id: "suspension", label: "20. Suspension and Termination" },
  { id: "cancellation", label: "21. Account Cancellation" },
  { id: "no-guarantee", label: "22. No Guarantee of Business Results" },
  { id: "disclaimers", label: "23. Disclaimers" },
  { id: "liability", label: "24. Limitation of Liability" },
  { id: "indemnification", label: "25. Indemnification" },
  { id: "privacy", label: "26. Privacy" },
  { id: "changes-service", label: "27. Changes to Dealioo" },
  { id: "changes-terms", label: "28. Changes to These Terms" },
  { id: "governing-law", label: "29. Governing Law and Disputes" },
  { id: "contact", label: "30. Contact Us" },
] as const;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-b py-10 last:border-b-0 sm:scroll-mt-32 sm:py-12"
      style={{ borderColor: "var(--landing-border)" }}
    >
      <h2 className="brand-landing-display text-xl font-semibold tracking-tight text-[var(--landing-text)] sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-[1.75] text-[#334155] sm:text-base sm:leading-[1.8]">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2 pl-0">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            className="mt-2.5 size-1.5 shrink-0 rounded-full"
            style={{ background: BRAND_COLORS.blue }}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TableOfContents({
  className = "",
}: {
  className?: string;
}) {
  return (
    <nav aria-label="Terms of Service sections" className={className}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">
        On this page
      </p>
      <ul className="mt-3 max-h-[min(70vh,36rem)] space-y-1.5 overflow-y-auto pr-1 text-sm">
        {TOC.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1 text-[#475569] transition hover:bg-[#f1f5f9] hover:text-[var(--landing-text)]"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileToc() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm font-semibold text-[var(--landing-text)]"
        style={{ borderColor: "var(--landing-border)" }}
        aria-expanded={open}
      >
        On this page
        <ChevronDown
          className={`size-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          className="mt-2 rounded-xl border bg-white p-3"
          style={{ borderColor: "var(--landing-border)" }}
        >
          <TableOfContents />
        </div>
      ) : null}
    </div>
  );
}

export function TermsOfServiceContent() {
  return (
    <div className="landing-page landing-page-shell min-h-dvh overflow-x-hidden">
      <AuthLandingNav />

      <main>
        <section className="landing-story-section bg-white pb-8 pt-[4.5rem] sm:pb-12 sm:pt-20">
          <div className="brand-landing-section mx-auto max-w-[56.25rem]">
            <header
              className="border-b pb-8 sm:pb-10"
              style={{ borderColor: "var(--landing-border)" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: BRAND_COLORS.blue }}
              >
                Legal
              </p>
              <h1 className="brand-landing-display mt-2 text-3xl font-semibold tracking-tight text-[var(--landing-text)] sm:text-4xl">
                Terms of Service
              </h1>
              <p className="mt-3 text-sm text-[#64748b] sm:text-base">
                Last Updated: {LAST_UPDATED}
              </p>
              <p className="mt-5 max-w-3xl text-[0.95rem] leading-[1.75] text-[#334155] sm:text-base sm:leading-[1.8]">
                These Terms of Service (“Terms”) govern your access to and use
                of Dealioo’s websites, applications, and related services
                (together, “Dealioo” or the “Service”). By using Dealioo, you
                agree to these Terms and to our{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2 hover:decoration-brand-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </header>

            <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <TableOfContents />
                </div>
              </aside>

              <div className="min-w-0">
                <MobileToc />

                <Section id="acceptance" title="1. Acceptance of Terms">
                  <p>
                    By creating an account, accessing Dealioo, or using any part
                    of the Service, you agree to be bound by these Terms and the
                    Privacy Policy. If you do not agree, do not use Dealioo.
                  </p>
                  <p>
                    If you create an account or use Dealioo on behalf of a
                    company or other organization, you represent that you have
                    authority to accept these Terms on behalf of that
                    organization, and “you” includes that organization.
                  </p>
                </Section>

                <Section id="about" title="2. About Dealioo">
                  <p>
                    Dealioo provides business marketing and offer-commerce
                    software. Depending on your plan and configuration, Dealioo
                    may include tools for:
                  </p>
                  <BulletList
                    items={[
                      "Promotional campaign creation",
                      "Signup and conversion funnels",
                      "QR codes and digital passes",
                      "Guest and customer management",
                      "Orders and campaign activity tracking",
                      "Marketing automation",
                      "SMS messaging integrations",
                      "Meta advertising integration",
                      "Google Ads integration",
                      "Payment integrations",
                      "Campaign analytics",
                      "Business performance reporting",
                      "AI-assisted campaign and funnel features",
                    ]}
                  />
                  <p>
                    Dealioo provides software and technology tools. Dealioo does
                    not operate your underlying business, restaurant, store, or
                    professional practice, and does not become a party to
                    transactions between you and your customers except as
                    expressly stated in product documentation.
                  </p>
                </Section>

                <Section id="eligibility" title="3. Eligibility and Business Use">
                  <p>To use Dealioo, you must:</p>
                  <BulletList
                    items={[
                      "Be legally capable of entering into a binding agreement",
                      "Provide accurate account and business information",
                      "Use Dealioo only for lawful purposes",
                      "Have authority to represent the business you register",
                      "Comply with applicable laws and third-party platform requirements (including Meta, Google, Stripe, and Twilio where used)",
                    ]}
                  />
                </Section>

                <Section
                  id="account"
                  title="4. Account Registration and Security"
                >
                  <p>
                    You are responsible for your account credentials, password
                    security, and any two-factor authentication methods you
                    enable. Keep your information accurate and up to date.
                  </p>
                  <p>
                    You are responsible for activities performed through your
                    account, except where unauthorized access results solely from
                    a security failure on Dealioo’s side. Promptly notify Dealioo
                    at{" "}
                    <a
                      href={SUPPORT_MAILTO}
                      className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                    >
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    if you believe your account has been compromised or used
                    without authorization.
                  </p>
                </Section>

                <Section
                  id="team"
                  title="5. Business Accounts and Team Members"
                >
                  <p>
                    Dealioo may allow multiple users to access one business
                    workspace. Roles may include Admin, Manager, Viewer, Scanner,
                    and other permissions configured in the product.
                  </p>
                  <p>
                    Business administrators are responsible for granting,
                    reviewing, and removing team access. Actions taken by
                    authorized team members may be treated as actions of the
                    business.
                  </p>
                </Section>

                <Section id="billing" title="6. Subscription Plans and Billing">
                  <p>
                    Some Dealioo functionality may require a paid subscription.
                    Fees may be charged on a recurring basis according to the
                    plan you select.
                  </p>
                  <BulletList
                    items={[
                      "Subscription fees are separate from advertising spend, payment processing fees, SMS charges, and other third-party service charges",
                      "You are responsible for applicable taxes",
                      "Dealioo may update subscription pricing with appropriate notice",
                      "Failed payments may result in restricted or suspended access",
                    ]}
                  />
                </Section>

                <Section id="payments" title="7. Payments and Stripe">
                  <p>
                    Dealioo may integrate with Stripe or similar payment
                    providers so businesses can accept payments related to offers
                    and campaigns.
                  </p>
                  <BulletList
                    items={[
                      "Payment processing may be provided by Stripe",
                      "Businesses may be required to create or connect a Stripe account",
                      "Stripe’s separate terms and policies apply to payment processing",
                      "Dealioo is not a bank or card issuer",
                      "Businesses remain responsible for their products, services, refunds, disputes, chargebacks, taxes, and customer obligations unless Dealioo expressly states otherwise",
                    ]}
                  />
                </Section>

                <Section
                  id="promotions"
                  title="8. Promotions, Rewards and Offers"
                >
                  <p>
                    Businesses are solely responsible for campaigns, rewards,
                    discounts, offers, and promotions they create in Dealioo,
                    including:
                  </p>
                  <BulletList
                    items={[
                      "Offer accuracy",
                      "Eligibility requirements",
                      "Pricing",
                      "Availability",
                      "Expiration dates",
                      "Redemption conditions",
                      "Product or service fulfillment",
                      "Customer complaints",
                      "Compliance with consumer protection and advertising laws",
                    ]}
                  />
                  <p>
                    Dealioo provides technology to create, distribute, track, and
                    redeem offers. Dealioo does not guarantee that an offer will
                    be legally compliant, commercially successful, or suitable
                    for your business.
                  </p>
                </Section>

                <Section id="meta" title="9. Meta Advertising Integration">
                  <p>
                    Dealioo may allow you to connect Meta advertising accounts
                    through Meta OAuth and the Meta Marketing API. Through
                    Dealioo, you may be able to:
                  </p>
                  <BulletList
                    items={[
                      "Connect a Meta account",
                      "Select an ad account",
                      "Select a Facebook Page",
                      "Build campaigns and ad sets",
                      "Upload or select creative media",
                      "Create advertising creatives",
                      "Publish ads",
                      "Review advertising performance",
                    ]}
                  />
                  <p>
                    By connecting Meta, you authorize Dealioo to perform
                    supported actions through Meta APIs on your behalf. You
                    remain responsible for advertising content, targeting,
                    budgets, compliance with Meta policies, and the products or
                    services you advertise.
                  </p>
                  <p>
                    Dealioo does not guarantee that Meta will approve or continue
                    delivering any advertisement. Meta may independently reject,
                    limit, suspend, modify, or stop campaigns.
                  </p>
                </Section>

                <Section id="google" title="10. Google Ads Integration">
                  <p>
                    Dealioo may allow you to connect Google Ads through Google
                    OAuth and the Google Ads API. You may be able to:
                  </p>
                  <BulletList
                    items={[
                      "Connect a Google account",
                      "Select a Google Ads customer account",
                      "Build campaign drafts",
                      "Configure budgets and targeting",
                      "Add keywords",
                      "Create ad groups and responsive search ads",
                      "Publish campaigns",
                      "Review campaign performance",
                    ]}
                  />
                  <p>
                    You remain responsible for advertising content, targeting,
                    budgets, keywords, and compliance with Google Ads policies.
                    Dealioo does not guarantee approval or delivery by Google.
                  </p>
                </Section>

                <Section id="ad-spend" title="11. Advertising Spend">
                  <p>
                    Advertising spend is separate from Dealioo subscription fees.
                    When you configure advertising budgets through Dealioo,
                    charges may be incurred directly through your connected Meta
                    or Google advertising account under that provider’s billing
                    terms.
                  </p>
                  <p>
                    Dealioo does not guarantee any specific advertising return,
                    including impressions, clicks, leads, purchases, customers,
                    revenue, or return on ad spend.
                  </p>
                </Section>

                <Section id="messaging" title="12. Messaging and Twilio">
                  <p>
                    Dealioo may integrate with Twilio or similar messaging
                    services. Businesses may connect their own messaging
                    account. Messaging provider fees may be separate from
                    Dealioo fees.
                  </p>
                  <p>Businesses are responsible for:</p>
                  <BulletList
                    items={[
                      "Obtaining required consent",
                      "Sending messages only to authorized recipients",
                      "Respecting opt-outs",
                      "Following applicable SMS and marketing laws",
                      "Avoiding spam, deceptive messaging, harassment, or prohibited content",
                    ]}
                  />
                </Section>

                <Section id="guest-data" title="13. Customer and Guest Data">
                  <p>
                    Businesses may collect customer or guest information using
                    Dealioo funnels and campaigns. You are responsible for
                    ensuring you have a lawful basis and any required consent to
                    collect and process that information.
                  </p>
                  <p>
                    Dealioo processes this data to provide the platform and
                    related functionality. Additional details are described in
                    our{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </Section>

                <Section id="third-party" title="14. Third-Party Services">
                  <p>
                    Dealioo relies on or integrates with third-party providers,
                    which may include Meta, Google, Stripe, Twilio, hosting and
                    infrastructure providers, and analytics services.
                  </p>
                  <BulletList
                    items={[
                      "Third-party services operate under their own terms and policies",
                      "Dealioo does not control their availability",
                      "Third-party APIs may change",
                      "Integrations may stop working due to provider changes, restrictions, outages, or discontinued services",
                    ]}
                  />
                </Section>

                <Section id="acceptable-use" title="15. Acceptable Use">
                  <p>You must not use Dealioo to:</p>
                  <BulletList
                    items={[
                      "Commit fraud",
                      "Send spam or phishing messages",
                      "Distribute malware",
                      "Violate laws or regulations",
                      "Impersonate others",
                      "Infringe intellectual property rights",
                      "Promote prohibited or illegal products or services",
                      "Circumvent security controls",
                      "Attempt unauthorized access",
                      "Scrape or extract information without authorization",
                      "Abuse APIs",
                      "Interfere with Dealioo infrastructure",
                      "Use the service to harm another person or organization",
                    ]}
                  />
                </Section>

                <Section id="ai" title="16. AI-Assisted Features">
                  <p>
                    Dealioo may provide AI-powered tools to assist with campaign
                    content, funnel content, marketing suggestions, copywriting,
                    and UI or campaign recommendations.
                  </p>
                  <p>
                    AI-generated output may be incomplete, incorrect, or
                    unsuitable. You are responsible for reviewing AI-generated
                    content before using or publishing it. Dealioo does not
                    guarantee the accuracy or effectiveness of AI-generated
                    suggestions.
                  </p>
                </Section>

                <Section id="user-content" title="17. User Content">
                  <p>
                    “User Content” means information you upload or enter into
                    Dealioo, including business logos, images, videos, menus,
                    business descriptions, campaign content, promotional copy,
                    advertising media, and product information.
                  </p>
                  <p>
                    You retain ownership of your User Content. You grant Dealioo
                    only the rights reasonably necessary to host, process,
                    display, transmit, and use that content to operate the
                    Service. You represent that you have the legal right to
                    upload any content you provide.
                  </p>
                </Section>

                <Section id="ip" title="18. Dealioo Intellectual Property">
                  <p>
                    Dealioo retains ownership of its software, source code,
                    platform design, branding, logos, documentation, platform
                    functionality, and proprietary technology. You receive only
                    a limited right to access and use the Service according to
                    these Terms and your subscription.
                  </p>
                </Section>

                <Section id="availability" title="19. Service Availability">
                  <p>
                    Dealioo aims to provide reliable service but does not
                    guarantee uninterrupted availability. The Service may be
                    temporarily unavailable because of maintenance,
                    infrastructure outages, security incidents, software updates,
                    third-party API failures, or provider outages.
                  </p>
                  <p>
                    Dealioo may modify, add, remove, or discontinue features from
                    time to time.
                  </p>
                </Section>

                <Section id="suspension" title="20. Suspension and Termination">
                  <p>
                    Dealioo may suspend or terminate access for reasons
                    including non-payment, fraud, abuse, security risks, illegal
                    activity, violation of these Terms, violation of third-party
                    platform policies, or actions that could harm Dealioo or
                    other users.
                  </p>
                  <p>
                    Where appropriate and practical, Dealioo may provide notice
                    before suspension or termination.
                  </p>
                </Section>

                <Section id="cancellation" title="21. Account Cancellation">
                  <p>
                    You may stop using Dealioo at any time and may cancel your
                    account using in-product controls where available, or by
                    contacting support. Cancellation does not automatically
                    eliminate outstanding fees or other legal obligations.
                  </p>
                  <p>
                    Retention or deletion of account data after cancellation is
                    described in the{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </Section>

                <Section
                  id="no-guarantee"
                  title="22. No Guarantee of Business Results"
                >
                  <p>
                    Dealioo provides software tools. Dealioo does not guarantee
                    business outcomes, including sales, revenue, marketing
                    results, campaign performance, customer acquisition,
                    retention, advertising performance, or conversion rates.
                    Businesses remain responsible for their commercial
                    decisions.
                  </p>
                </Section>

                <Section id="disclaimers" title="23. Disclaimers">
                  <p>
                    To the fullest extent permitted by applicable law, Dealioo
                    is provided on an “as available” basis. Functionality may
                    depend on external platforms and services (including Meta,
                    Google, Stripe, Twilio, and hosting providers). Dealioo does
                    not warrant that the Service will be error-free, secure
                    against all threats, or continuously available, or that it
                    will meet every business requirement.
                  </p>
                </Section>

                <Section id="liability" title="24. Limitation of Liability">
                  <p>
                    To the fullest extent permitted by applicable law, Dealioo
                    and its affiliates, officers, employees, and agents will not
                    be liable for indirect, incidental, special, consequential,
                    or punitive damages, or for lost revenue, lost profits, lost
                    business opportunities, advertising losses, third-party
                    service failures, or service interruptions, arising out of or
                    related to your use of Dealioo.
                  </p>
                </Section>

                <Section id="indemnification" title="25. Indemnification">
                  <p>
                    To the fullest extent permitted by law, you agree to defend,
                    indemnify, and hold harmless Dealioo from and against claims,
                    damages, losses, and expenses (including reasonable legal
                    fees) arising from your campaigns, offers, products or
                    services, advertising content, User Content, violation of
                    laws, violation of third-party rights, or misuse of Dealioo.
                  </p>
                </Section>

                <Section id="privacy" title="26. Privacy">
                  <p>
                    Dealioo’s handling of personal information is described in
                    our{" "}
                    <Link
                      href="/privacy"
                      className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    . By using Dealioo, you acknowledge that policy.
                  </p>
                </Section>

                <Section id="changes-service" title="27. Changes to Dealioo">
                  <p>
                    Dealioo may add, modify, or remove features; change
                    integrations; update APIs; and introduce new services.
                    Material changes will be communicated where appropriate.
                  </p>
                </Section>

                <Section id="changes-terms" title="28. Changes to These Terms">
                  <p>
                    Dealioo may update these Terms from time to time. Updated
                    Terms will display a revised “Last Updated” date. Where
                    legally required or appropriate, we may provide notice of
                    material changes. Continued use of Dealioo after the updated
                    Terms become effective constitutes acceptance of the
                    changes, except where applicable law requires otherwise.
                  </p>
                </Section>

                <Section
                  id="governing-law"
                  title="29. Governing Law and Disputes"
                >
                  <p>
                    These Terms and any dispute arising from them will be
                    governed by applicable law, without regard to conflict-of-law
                    principles, as confirmed by Dealioo’s legal counsel.
                  </p>
                </Section>

                <Section id="contact" title="30. Contact Us">
                  <p>
                    Questions about these Terms may be sent using the details
                    below.
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <strong className="font-semibold text-[var(--landing-text)]">
                        Dealioo
                      </strong>
                    </li>
                    <li>
                      Support:{" "}
                      <a
                        href={SUPPORT_MAILTO}
                        className="font-semibold text-[var(--landing-text)] underline decoration-[var(--landing-border)] underline-offset-2"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                    </li>
                  </ul>
                </Section>
              </div>
            </div>
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
