"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { SignupBrandIllustration } from "@/app/components/auth/SignupBrandIllustration";
import Link from "next/link";

export type LoginBrandPanelProps = {
  signupHref: string;
};

export function LoginBrandPanel({ signupHref }: LoginBrandPanelProps) {
  return (
    <aside className="auth-signup-brand-panel" aria-label="Sign in to Dealioo">
      <div className="auth-signup-brand-panel-inner">
        <div className="auth-signup-brand-copy">
          <p className="landing-section-eyebrow auth-signup-brand-eyebrow">Sign in</p>

          <h2 className="auth-signup-brand-title">
            <span className="auth-signup-brand-title-lead">Welcome back to</span>
            <DealiooLogo
              variant="dark"
              transparent
              className="auth-signup-brand-title-logo"
              priority
            />
          </h2>
        </div>

        <div className="auth-signup-brand-illustration">
          <SignupBrandIllustration />
        </div>

        <div className="auth-signup-brand-actions">
          <p className="auth-signup-brand-login">Don&apos;t have an account?</p>
          <Link href={signupHref} className="auth-signup-brand-cta">
            Sign up free
          </Link>
        </div>
      </div>
    </aside>
  );
}
