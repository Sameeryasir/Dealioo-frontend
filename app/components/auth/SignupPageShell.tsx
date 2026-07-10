"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { SignupBrandPanel } from "@/app/components/auth/SignupBrandPanel";
import { SignupBrandIllustration } from "@/app/components/auth/SignupBrandIllustration";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import type { ReactNode } from "react";
import { useState } from "react";

export type SignupPageShellProps = {
  loginHref: string;
  signupHref?: string;
  /** When true, hides the left brand illustration panel (e.g. plan selection step). */
  hideBrandPanel?: boolean;
  children: ReactNode;
};

export function SignupPageShell({
  loginHref,
  signupHref,
  hideBrandPanel = false,
  children,
}: SignupPageShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className={`landing-page auth-signup-page${
        hideBrandPanel ? " auth-signup-page--plan-only" : ""
      }${mobileNavOpen ? " landing-page-shell--menu-open" : ""}`}
      data-auth-signup-page
    >
      <AuthLandingNav
        loginHref={loginHref}
        signupHref={signupHref}
        onMenuOpenChange={setMobileNavOpen}
      />

      <main className="auth-signup-main">
        <div className="auth-signup-inner">
          <div className="auth-signup-card">
            {!hideBrandPanel ? <SignupBrandPanel loginHref={loginHref} /> : null}

            <div className="auth-signup-split-form">
              {!hideBrandPanel ? (
                <header className="auth-signup-card-header">
                  <div className="auth-signup-card-header-inner auth-signup-mobile-header-inner">
                    <div className="auth-signup-mobile-header-copy">
                      <p className="landing-section-eyebrow">Create your account</p>
                      <h1 className="brand-landing-display auth-signup-title">
                        <span className="auth-signup-title-lead">Get started with</span>
                        <DealiooLogo
                          variant="dark"
                          transparent
                          className="auth-signup-title-logo"
                          priority
                        />
                      </h1>
                    </div>
                    <div className="auth-signup-mobile-header-art">
                      <SignupBrandIllustration layout="mobile-header" />
                    </div>
                  </div>
                </header>
              ) : null}

              <div className="auth-signup-card-body">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
