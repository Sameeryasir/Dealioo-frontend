"use client";

import {
  LandingPricing,
  LandingSpotlightBand,
} from "@/app/components/landing/LandingEditorialSections";
import { LandingAuthEntry } from "@/app/components/landing/LandingAuthEntry";
import { LandingHero } from "@/app/components/landing/LandingHero";
import { LandingIntegrationsBar } from "@/app/components/landing/LandingIntegrationsBar";
import { Reveal, ScrollProgress } from "@/app/components/landing/LandingMotionParts";
import {
  LandingAboutUs,
  LandingBuiltForGrowth,
  LandingHowItWorks,
  LandingWhyDealioo,
} from "@/app/components/landing/LandingStorySections";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { landingLoginHref, landingSignupHref } from "@/app/components/landing/landing-auth";
import { useLandingPageEntry } from "@/app/components/landing/useLandingPageEntry";

const LANDING_LOGO_SRC = "/black-logo.png";
const LANDING_LOGO_WIDTH = 562;
const LANDING_LOGO_HEIGHT = 144;
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function LandingPageContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const entryKey = useLandingPageEntry();
  const signupHref = landingSignupHref(returnTo);
  const loginHref = landingLoginHref(returnTo);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (returnTo == null || returnTo.trim() === "") return;
    const timer = window.setTimeout(() => {
      document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [returnTo]);

  const navLinks = [
    ["How it works", "#how-it-works"],
    ["Pricing", "#pricing"],
    ["About", "#about"],
    ["Login", loginHref],
  ] as const;

  return (
    <div
      className={`landing-page landing-page-shell min-h-screen ${
        mobileNavOpen ? "landing-page-shell--menu-open" : "overflow-x-hidden"
      }`}
    >
      <ScrollProgress />

      <AnimatePresence>
        {returnTo ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative z-50 border-b border-brand-border bg-brand-soft px-4 py-2.5 text-center text-sm font-medium text-brand-navy"
          >
            Please log in to continue to your dashboard.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <header
        className={`brand-landing-nav transition-all duration-300 ${
          navScrolled ? "landing-nav-scrolled" : ""
        } ${mobileNavOpen ? "landing-nav-menu-open" : ""}`}
      >
        <div className="brand-landing-section brand-landing-nav-inner">
          <Link href="/" className="landing-nav-logo shrink-0 py-0.5">
            <DealiooLogo
              src={LANDING_LOGO_SRC}
              width={LANDING_LOGO_WIDTH}
              height={LANDING_LOGO_HEIGHT}
              variant="light"
              className="h-9 w-auto sm:h-[2.625rem] md:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            {navLinks.map(([label, href]) => {
              const isInternal = href.startsWith("/");
              const LinkTag = isInternal ? Link : "a";
              return (
                <LinkTag
                  key={href}
                  href={href}
                  className="landing-nav-link text-sm font-medium transition-colors"
                >
                  {label}
                </LinkTag>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href={signupHref} className="landing-btn-primary px-6 py-2.5 text-sm font-bold">
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="landing-theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl border"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.button
              type="button"
              key="mobile-nav-backdrop"
              className="landing-mobile-nav-backdrop md:hidden"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.nav
              key="mobile-nav-sheet"
              className="landing-mobile-nav-sheet md:hidden"
              aria-label="Mobile"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <ul className="landing-mobile-nav-list">
                {navLinks.map(([label, href]) => {
                  const isInternal = href.startsWith("/");
                  const LinkTag = isInternal ? Link : "a";
                  return (
                    <li key={href}>
                      <LinkTag
                        href={href}
                        className="landing-mobile-nav-link"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {label}
                      </LinkTag>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={signupHref}
                className="landing-btn-primary landing-mobile-nav-cta"
                onClick={() => setMobileNavOpen(false)}
              >
                Get Started
              </Link>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>

      <div
        key={entryKey}
        className={`landing-page-content${mobileNavOpen ? " landing-page-main--menu-open" : ""}`}
      >
      <main className="relative z-[1]">
        <div className="landing-hero-block">
          <LandingHero signupHref={signupHref} />
        </div>

        <LandingIntegrationsBar />

        <LandingHowItWorks />

        <LandingSpotlightBand />

        <LandingBuiltForGrowth />

        <LandingPricing returnTo={returnTo} />

        <LandingWhyDealioo />

        <LandingAboutUs />

        <section
          id="account"
          className="landing-auth-cta-section scroll-mt-16 bg-white py-10 sm:py-12 md:scroll-mt-28"
          aria-label="Create your account"
        >
          <Reveal className="brand-landing-section relative z-10">
            <LandingAuthEntry returnTo={returnTo} />
          </Reveal>
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
              The AI platform that helps businesses turn ad clicks into repeat customers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
            <FooterCol
              title="Product"
              links={[
                ["Features", "#growth"],
                ["How it works", "#how-it-works"],
                ["Pricing", "#pricing"],
                ["About", "#about"],
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                ["Login", loginHref],
                ["Get Started", signupHref],
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
                ["Contact", "mailto:support@dealioo.com"],
              ]}
            />
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
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="landing-footer-title text-sm font-semibold">{title}</p>
      <ul className="landing-text-muted mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("mailto:") ? (
              <a href={href} className="transition hover:text-brand-primary">
                {label}
              </a>
            ) : href.startsWith("/") || href.startsWith("/auth/") ? (
              <Link href={href} className="transition hover:text-brand-primary">
                {label}
              </Link>
            ) : (
              <a href={href} className="transition hover:text-brand-primary">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
