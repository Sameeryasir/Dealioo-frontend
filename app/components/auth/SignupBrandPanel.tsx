"use client";

import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { SignupBrandIllustration } from "@/app/components/auth/SignupBrandIllustration";
import Link from "next/link";

export type SignupBrandPanelProps = {
  loginHref: string;
};

export function SignupBrandPanel({ loginHref }: SignupBrandPanelProps) {
  return (
    <aside className="auth-signup-brand-panel" aria-label="Create your Dealioo account">
      <div className="auth-signup-brand-panel-inner">
        <div className="auth-signup-brand-copy">
          <p className="landing-section-eyebrow auth-signup-brand-eyebrow">Create your account</p>

          <h2 className="auth-signup-brand-title">
            <span className="auth-signup-brand-title-lead">Get started with</span>
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
          <p className="auth-signup-brand-login">Already have an account?</p>
          <Link href={loginHref} className="auth-signup-brand-cta">
            Log in
          </Link>
        </div>
      </div>
    </aside>
  );
}
