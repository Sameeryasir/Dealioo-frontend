"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { notifyGoogleOAuthAuthenticated } from "@/app/lib/google-oauth-popup";

function GoogleConnectedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const [selectingAccount, setSelectingAccount] = useState(false);

  const selectCustomerHref =
    businessId != null
      ? `/google/select-customer?businessId=${businessId}`
      : "/dashboard";

  useEffect(() => {
    if (businessId == null) return;
    notifyGoogleOAuthAuthenticated(businessId);
  }, [businessId]);

  const handleSelectAdsAccount = () => {
    if (selectingAccount) return;
    setSelectingAccount(true);
    router.push(selectCustomerHref);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="flex items-start gap-2.5">
          <Shield
            className="mt-0.5 size-[18px] shrink-0 text-emerald-600"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] leading-snug text-[#1c1e21]">
              <DealiooLogo
                src="/black-logo.png"
                className="inline-block h-[15px] w-auto"
                width={562}
                height={144}
              />
              <span>connected successfully</span>
            </p>
            <p className="m-0 text-[13px] leading-snug text-[#65676b]">
              Google Ads access is granted. Select an Ads account to finish
              setup.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 px-3.5 py-3.5">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff]"
              aria-hidden
            >
              <CheckCircle2
                className="size-5 text-[#1877F2]"
                strokeWidth={2}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="m-0 text-[15px] font-semibold leading-snug text-[#1c1e21]">
                  Google Ads connected
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="size-3" strokeWidth={2.5} />
                  Granted
                </span>
              </div>
              <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#65676b]">
                Pick which Google Ads customer account this business should use.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSelectAdsAccount}
          disabled={selectingAccount || businessId == null}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#1877F2] text-[16px] font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 disabled:cursor-wait disabled:opacity-90"
        >
          {selectingAccount ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Opening Ads accounts…
            </>
          ) : (
            <>
              <GoogleAdsLogo className="size-5 text-white" monochrome />
              Select Ads account
            </>
          )}
        </button>
      </div>
    </main>
  );
}

export default function GoogleConnectedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f5f6f8]">
          <p className="text-sm text-[#65676b]">Loading…</p>
        </main>
      }
    >
      <GoogleConnectedInner />
    </Suspense>
  );
}
