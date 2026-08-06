"use client";

import { AuthLandingNav } from "@/app/components/auth/AuthLandingNav";
import { findPricingPlan } from "@/app/components/landing/pricing-plans";
import { CheckCircle2 } from "lucide-react";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

function TalkToUsThankYouInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan")?.trim() || "";

  const planName = useMemo(() => {
    if (!planId) return null;
    return findPricingPlan(planId)?.name ?? null;
  }, [planId]);

  return (
    <div className="auth-select-plan-page flex min-h-dvh flex-col bg-brand-soft">
      <AuthLandingNav
        loginHref="/auth/login"
        signupHref="/auth/signup"
        showGetStarted={false}
        showNavLinks={false}
      />
      <main className="auth-select-plan-main flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-lg rounded-3xl border border-[#e8edf5] bg-white px-6 py-10 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5ee]">
            <CheckCircle2
              className="h-8 w-8 text-[#16a34a]"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <h1 className="brand-landing-display mt-5 text-3xl text-brand-navy sm:text-4xl">
            Thank you!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-body sm:text-base">
            {planName
              ? `We’ve received your interest in the ${planName} plan. Our team will be in touch soon.`
              : "We’ve received your interest. Our team will be in touch soon."}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function TalkToUsThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-brand-soft text-sm text-brand-muted">
          Loading…
        </div>
      }
    >
      <TalkToUsThankYouInner />
    </Suspense>
  );
}
