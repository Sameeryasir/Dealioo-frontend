"use client";

import { Shield } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { GOOGLE_ADS_PERMISSION_OPTIONS } from "@/app/lib/google-ads-permissions";

type GoogleAdsPermissionConsentProps = {
  disabled?: boolean;
  variant?: "default" | "compact";
};

export function GoogleAdsPermissionConsent({
  disabled = false,
  variant = "default",
}: GoogleAdsPermissionConsentProps) {
  const compact = variant === "compact";

  if (compact) {
    return (
      <div className="space-y-3.5">
        <p className="m-0 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Permissions Google will ask for
        </p>
        <ul className="m-0 list-none space-y-3 p-0" role="list">
          {GOOGLE_ADS_PERMISSION_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <div
                className={`rounded-2xl border border-[#e8edf5] bg-[#fbfcfe] px-4 py-4 transition ${
                  disabled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e8edf5] bg-white"
                    aria-hidden
                  >
                    <GoogleAdsLogo className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[0.9375rem] font-semibold leading-snug text-[#07111f]">
                      {opt.title}
                    </p>
                    <p className="m-0 mt-1.5 text-[0.8125rem] leading-relaxed text-slate-500">
                      {opt.description}
                    </p>
                    {opt.required ? (
                      <span className="mt-3 inline-flex rounded-md border border-[#ceead6] bg-[#f0faf3] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-[#137333]">
                        Required
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="m-0 text-[1rem] font-extrabold tracking-tight text-[#07111f]">
          Google Ads permissions
        </p>
        <div className="flex items-start gap-2.5">
          <Shield
            className="mt-0.5 size-[18px] shrink-0 text-[#188038]"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.875rem] leading-snug text-[#07111f]">
              <DealiooLogo
                src="/black-logo.png"
                className="inline-block h-[15px] w-auto"
                width={562}
                height={144}
              />
              <span>will ask Google for these permissions:</span>
            </p>
            <p className="m-0 text-[0.8125rem] leading-snug text-slate-500">
              You will see the same list on Google&apos;s consent screen. You
              can disconnect anytime in Settings → Integrations.
            </p>
          </div>
        </div>
      </div>

      <ul className="m-0 list-none space-y-3 p-0" role="list">
        {GOOGLE_ADS_PERMISSION_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <div className="rounded-2xl border border-[#e8edf5] bg-[#fbfcfe]">
              <div className="flex items-start gap-3.5 px-4 py-4">
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e8edf5] bg-white"
                  aria-hidden
                >
                  <GoogleAdsLogo className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[0.9375rem] font-semibold leading-snug text-[#07111f]">
                    {opt.title}
                  </p>
                  <p className="m-0 mt-1.5 text-[0.8125rem] leading-relaxed text-slate-500">
                    {opt.description}
                  </p>
                  {opt.required ? (
                    <span className="mt-3 inline-flex rounded-md border border-[#ceead6] bg-[#f0faf3] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-[#137333]">
                      Required
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
