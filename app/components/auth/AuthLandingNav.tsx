"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { landingLoginHref, landingSignupHref } from "@/app/components/landing/landing-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const LANDING_LOGO_SRC = "/black-logo.png";
const LANDING_LOGO_WIDTH = 562;
const LANDING_LOGO_HEIGHT = 144;

const NAV_LINKS = [
  ["How it works", "/#how-it-works"],
  ["Pricing", "/#pricing"],
  ["About", "/#about"],
] as const;

export type AuthLandingNavProps = {
  loginHref?: string;
  signupHref?: string;
  onMenuOpenChange?: (open: boolean) => void;
  showGetStarted?: boolean;
};

export function AuthLandingNav({
  loginHref: loginHrefProp,
  signupHref: signupHrefProp,
  onMenuOpenChange,
  showGetStarted = true,
}: AuthLandingNavProps) {
  const signupHref = signupHrefProp ?? landingSignupHref(null);
  const loginHref = loginHrefProp ?? landingLoginHref(null);
  const navLinks = [...NAV_LINKS, ["Login", loginHref] as const] as const;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const setMenuOpen = (open: boolean) => {
    setMobileNavOpen(open);
    onMenuOpenChange?.(open);
  };

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
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

  return (
    <>
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
            {navLinks.map(([label, href]) => (
              <Link key={href} href={href} className="landing-nav-link text-sm font-medium transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {showGetStarted ? (
              <Link href={signupHref} className="landing-btn-primary px-6 py-2.5 text-sm font-bold">
                Get Started
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="landing-theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl border"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMenuOpen(!mobileNavOpen)}
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
              onClick={() => setMenuOpen(false)}
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
                {navLinks.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="landing-mobile-nav-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              {showGetStarted ? (
                <Link
                  href={signupHref}
                  className="landing-btn-primary landing-mobile-nav-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              ) : null}
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
