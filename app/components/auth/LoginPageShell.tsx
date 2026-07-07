"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { LoginBrandPanel } from "@/app/components/auth/LoginBrandPanel";
import { SignupBrandIllustration } from "@/app/components/auth/SignupBrandIllustration";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

export type LoginPageShellProps = {
  loginHref: string;
  signupHref: string;
  children: ReactNode;
};

export function LoginPageShell({ loginHref, signupHref, children }: LoginPageShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className={`landing-page auth-signup-page auth-login-page${
        mobileNavOpen ? " landing-page-shell--menu-open" : ""
      }`}
      data-auth-login-page
    >
      <AuthLandingNav
        loginHref={loginHref}
        signupHref={signupHref}
        onMenuOpenChange={setMobileNavOpen}
      />

      <main className="auth-signup-main">
        <div className="auth-signup-inner">
          <div className="auth-signup-card">
            <LoginBrandPanel signupHref={signupHref} />

            <div className="auth-signup-split-form">
              <header className="auth-signup-card-header">
                <div className="auth-signup-card-header-inner auth-signup-mobile-header-inner">
                  <div className="auth-signup-mobile-header-copy">
                    <p className="landing-section-eyebrow">Sign in</p>
                    <h1 className="brand-landing-display auth-signup-title">
                      <span className="auth-signup-title-lead">Welcome back to</span>
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

              <div className="auth-signup-card-body">{children}</div>

              <footer className="auth-signup-card-footer">
                Don&apos;t have an account?{" "}
                <Link href={signupHref} className="font-semibold text-brand-primary hover:underline">
                  Sign up free
                </Link>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
