"use client";

/**
 * Google Ads permission consent UI shown during connect.
 * What: lists the Google OAuth permissions Dealioo will request.
 * Why: users should see the same “See, edit, create, and delete…” wording before Google opens.
 * Related: RegisterBusinessGoogleConnectStep, GoogleConnectPermissionsModal, google-ads-permissions.ts
 * MCP context 7: clear consent copy, no optional scopes (backend always requests these).
 */

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
      <div className="space-y-2.5 sm:space-y-3">
        <p className="m-0 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Permissions Google will ask for
        </p>
        <ul className="m-0 list-none space-y-2 p-0 sm:space-y-2.5" role="list">
          {GOOGLE_ADS_PERMISSION_OPTIONS.map((opt) => (
            <li key={opt.id}>
              <div
                className={`flex items-start gap-2.5 rounded-xl border border-[#ceead6] bg-[#F6FBF8] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5 ${
                  disabled ? "opacity-60" : ""
                }`}
              >
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-[#E6F4EA] text-[#188038]"
                  aria-hidden
                >
                  <GoogleAdsLogo className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-snug text-slate-900 sm:text-[15px]">
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
                    {opt.description}
                  </span>
                  {opt.required ? (
                    <span className="mt-1.5 inline-flex rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#137333]">
                      Required
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <p className="m-0 text-[16px] font-bold leading-snug text-[#1c1e21]">
          Google Ads permissions
        </p>
        <div className="flex items-start gap-2.5">
          <Shield
            className="mt-0.5 size-[18px] shrink-0 text-[#1a73e8]"
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
              <span>will ask Google for these permissions:</span>
            </p>
            <p className="m-0 text-[13px] leading-snug text-[#65676b]">
              You will see the same list on Google&apos;s consent screen. You
              can disconnect anytime in Settings → Integrations.
            </p>
          </div>
        </div>
      </div>

      <ul className="m-0 list-none space-y-2.5 p-0" role="list">
        {GOOGLE_ADS_PERMISSION_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <div className="rounded-xl border border-[#34A853]/35 bg-[#F6FBF8] shadow-[0_0_0_1px_rgba(52,168,83,0.08)]">
              <div className="flex items-start gap-3 px-3.5 py-3.5">
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#ceead6]"
                  aria-hidden
                >
                  <GoogleAdsLogo className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[15px] font-semibold leading-snug text-[#1c1e21]">
                    {opt.title}
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#65676b]">
                    {opt.description}
                  </p>
                  {opt.required ? (
                    <span className="mt-2 inline-flex rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#137333]">
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
