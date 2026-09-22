"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CheckCircle2, Flag, List, Loader2, Megaphone, Shield } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { notifyFacebookOAuthAuthenticated } from "@/app/lib/facebook-oauth-popup";
import {
  META_ADS_PERMISSION_OPTIONS,
  formatMetaScopeTitle,
  type MetaSelectableScopeId,
} from "@/app/lib/meta-ads-permissions";

function parseGrantedParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(/[,\s]+/)
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  ];
}

function isSelectableScopeId(scopeId: string): scopeId is MetaSelectableScopeId {
  return (
    scopeId === "ads_read" ||
    scopeId === "ads_management" ||
    scopeId === "pages_show_list" ||
    scopeId === "pages_read_engagement"
  );
}

function scopeVisual(scopeId: string): {
  Icon: typeof Megaphone;
  iconWrap: string;
  iconColor: string;
} {
  if (scopeId === "ads_management") {
    return {
      Icon: Megaphone,
      iconWrap: "bg-[#eaf8ef]",
      iconColor: "text-[#22c55e]",
    };
  }
  if (scopeId === "pages_show_list") {
    return {
      Icon: List,
      iconWrap: "bg-[#f3e8ff]",
      iconColor: "text-[#7c3aed]",
    };
  }
  if (scopeId === "pages_read_engagement") {
    return {
      Icon: Flag,
      iconWrap: "bg-[#fff4e5]",
      iconColor: "text-[#ea580c]",
    };
  }
  if (scopeId === "ads_read") {
    return {
      Icon: BarChart3,
      iconWrap: "bg-[#e8f1ff]",
      iconColor: "text-[#1877F2]",
    };
  }
  return {
    Icon: CheckCircle2,
    iconWrap: "bg-[#e8f1ff]",
    iconColor: "text-[#1877F2]",
  };
}

function FacebookConnectedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const [selectingAdAccount, setSelectingAdAccount] = useState(false);
  const granted = useMemo(
    () => parseGrantedParam(searchParams.get("granted")),
    [searchParams],
  );

  const selectAdAccountHref =
    businessId != null
      ? `/facebook/select-ad-account?businessId=${businessId}`
      : "/dashboard";

  useEffect(() => {
    if (businessId == null) return;
    notifyFacebookOAuthAuthenticated(businessId);
  }, [businessId]);

  const grantedOptions = useMemo(() => {
    return granted.map((scopeId) => {
      const option = META_ADS_PERMISSION_OPTIONS.find((opt) => opt.id === scopeId);
      return {
        id: scopeId,
        title: option?.title ?? formatMetaScopeTitle(scopeId),
        description:
          option?.description ?? "Granted by Meta for this connection.",
      };
    });
  }, [granted]);

  const handleSelectAdsAccount = () => {
    if (selectingAdAccount) return;
    setSelectingAdAccount(true);
    router.push(selectAdAccountHref);
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
              Permissions are granted. Select an ads account to finish setup.
            </p>
          </div>
        </div>

        {grantedOptions.length > 0 ? (
          <ul className="m-0 mt-4 list-none space-y-2.5 p-0" role="list">
            {grantedOptions.map((opt) => {
              const { Icon, iconWrap, iconColor } = scopeVisual(opt.id);

              return (
                <li key={opt.id}>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 px-3.5 py-3.5">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isSelectableScopeId(opt.id)
                            ? iconWrap
                            : "bg-emerald-100"
                        }`}
                        aria-hidden
                      >
                        <Icon
                          className={`size-5 ${
                            isSelectableScopeId(opt.id)
                              ? iconColor
                              : "text-emerald-600"
                          }`}
                          strokeWidth={2}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="m-0 text-[15px] font-semibold leading-snug text-[#1c1e21]">
                            {opt.title}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <CheckCircle2 className="size-3" strokeWidth={2.5} />
                            Granted
                          </span>
                        </div>
                        <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#65676b]">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={handleSelectAdsAccount}
          disabled={selectingAdAccount}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#1877F2] text-[16px] font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 disabled:cursor-wait disabled:opacity-90"
        >
          {selectingAdAccount ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Fetching ads account…
            </>
          ) : (
            <>
              <MetaLogo className="size-5 text-white" monochrome />
              Select ads account
            </>
          )}
        </button>
      </div>
    </main>
  );
}

export default function FacebookConnectedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f5f6f8]">
          <p className="text-sm text-[#65676b]">Loading…</p>
        </main>
      }
    >
      <FacebookConnectedInner />
    </Suspense>
  );
}
