"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CheckCircle2, Loader2, Megaphone, Shield } from "lucide-react";
import DealiooLogo from "@/app/components/brand/DealiooLogo";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import {
  notifyFacebookOAuthAuthenticated,
  notifyFacebookOAuthComplete,
} from "@/app/lib/facebook-oauth-popup";
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
  return scopeId === "ads_read" || scopeId === "ads_management";
}

function FacebookConnectedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const granted = useMemo(
    () => parseGrantedParam(searchParams.get("granted")),
    [searchParams],
  );

  const integrationsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/settings/integrations`
      : "/dashboard";

  useEffect(() => {
    if (businessId == null) return;

    notifyFacebookOAuthAuthenticated(businessId);

    const timer = window.setTimeout(() => {
      if (notifyFacebookOAuthComplete(businessId)) {
        return;
      }
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.location.assign(integrationsHref);
          window.close();
          return;
        }
      } catch {
        /* ignore */
      }
      router.replace(integrationsHref);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [businessId, integrationsHref, router]);

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
              Taking you back to Integrations…
            </p>
          </div>
        </div>

        {grantedOptions.length > 0 ? (
          <ul className="m-0 mt-4 list-none space-y-2.5 p-0" role="list">
            {grantedOptions.map((opt) => {
              const Icon =
                opt.id === "ads_management"
                  ? Megaphone
                  : opt.id === "ads_read"
                    ? BarChart3
                    : CheckCircle2;
              const iconWrap =
                opt.id === "ads_management" ? "bg-[#eaf8ef]" : "bg-[#e8f1ff]";
              const iconColor =
                opt.id === "ads_management"
                  ? "text-[#22c55e]"
                  : "text-[#1877F2]";

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

        <p className="mt-5 m-0 flex items-center justify-center gap-2 text-[13px] text-[#65676b]">
          <Loader2 className="size-4 animate-spin text-[#1877F2]" aria-hidden />
          Returning to Integrations…
        </p>
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
