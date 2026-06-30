import { LandingPageContent } from "@/app/components/landing/LandingPageContent";
import { Suspense } from "react";

function LandingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft">
      <p className="text-sm text-brand-muted">Loading…</p>
    </div>
  );
}

export function OwnerLandingPage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPageContent />
    </Suspense>
  );
}
