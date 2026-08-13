"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  Megaphone,
  Shield,
  type LucideIcon,
} from "lucide-react";
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

const PERMISSION_VISUALS: Record<
  MetaSelectableScopeId,
  { Icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  ads_read: {
    Icon: BarChart3,
    iconWrap: "bg-[#e8f1ff]",
    iconColor: "text-[#1877F2]",
  },
  ads_management: {
    Icon: Megaphone,
    iconWrap: "bg-[#eaf8ef]",
    iconColor: "text-[#22c55e]",
  },
};

function isSelectableScopeId(scopeId: string): scopeId is MetaSelectableScopeId {
  return scopeId === "ads_read" || scopeId === "ads_management";
}

function FacebookConnectedInner() {
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const granted = useMemo(
    () => parseGrantedParam(searchParams.get("granted")),
    [searchParams],
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tell the opener Meta connect succeeded as soon as this page loads,
  // so closing the tab is not treated as "cancelled".
  useEffect(() => {
    if (businessId == null) return;
    notifyFacebookOAuthAuthenticated(businessId);
  }, [businessId]);

  const selectHref =
    businessId != null
      ? `/facebook/select-ad-account?businessId=${businessId}`
      : "/dashboard";

  const grantedOptions = useMemo(() => {
    return granted.map((scopeId) => {
      const option = META_ADS_PERMISSION_OPTIONS.find((opt) => opt.id === scopeId);
      return {
        id: scopeId,
        title: option?.title ?? formatMetaScopeTitle(scopeId),
        description:
          option?.description ?? "Granted by Meta for this connection.",
        tooltip: option?.tooltip ?? null,
      };
    });
  }, [granted]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="space-y-3.5">
          <div className="flex items-start gap-2.5">
            <Shield
              className="mt-0.5 size-[18px] shrink-0 text-[#1877F2]"
              strokeWidth={2}
              aria-hidden
            />
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] leading-snug text-[#1c1e21]">
              <DealiooLogo
                src="/black-logo.png"
                className="inline-block h-[15px] w-auto"
                width={562}
                height={144}
              />
              <span>connected successfully. Meta granted these permissions:</span>
            </p>
          </div>

          {grantedOptions.length > 0 ? (
            <ul className="m-0 list-none space-y-2.5 p-0" role="list">
              {grantedOptions.map((opt) => {
                const expanded = expandedId === opt.id;
                const visual = isSelectableScopeId(opt.id)
                  ? PERMISSION_VISUALS[opt.id]
                  : null;
                const Icon = visual?.Icon ?? Check;

                return (
                  <li key={opt.id}>
                    <div className="rounded-xl border border-[#1877F2]/45 bg-white">
                      <div className="flex items-start gap-3 px-3.5 py-3.5">
                        <span
                          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            visual?.iconWrap ?? "bg-[#e8f1ff]"
                          }`}
                          aria-hidden
                        >
                          <Icon
                            className={`size-5 ${visual?.iconColor ?? "text-[#1877F2]"}`}
                            strokeWidth={2}
                          />
                        </span>

                        <span
                          className="mt-2.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-[#1877F2] bg-[#1877F2] text-white"
                          aria-hidden
                        >
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="m-0 text-[15px] font-semibold leading-snug text-[#1c1e21]">
                            {opt.title}
                          </p>
                          <p className="m-0 mt-0.5 text-[13px] leading-snug text-[#65676b]">
                            {opt.description}
                          </p>
                        </div>

                        {opt.tooltip ? (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? `Hide details for ${opt.title}`
                                : `Show details for ${opt.title}`
                            }
                            onClick={() =>
                              setExpandedId((current) =>
                                current === opt.id ? null : opt.id,
                              )
                            }
                            className="mt-1.5 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#8a8d91] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
                          >
                            <ChevronDown
                              className={`size-4 transition-transform ${
                                expanded ? "rotate-180" : ""
                              }`}
                              aria-hidden
                            />
                          </button>
                        ) : null}
                      </div>

                      {expanded && opt.tooltip ? (
                        <div className="border-t border-[#e4e6eb] px-3.5 py-3 text-[13px] leading-relaxed text-[#65676b]">
                          {opt.tooltip}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="m-0 text-[13px] leading-snug text-[#65676b]">
              No permission details were returned. You can still choose an ad
              account to continue.
            </p>
          )}
        </div>

        <p className="mt-4 m-0 text-center text-[13px] leading-snug text-[#65676b]">
          Next, choose which ad account Dealioo should use.
        </p>

        <Link
          href={selectHref}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#1877F2] text-[16px] font-bold text-white no-underline transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40"
        >
          <MetaLogo className="size-5 text-white" monochrome />
          Select Meta Ad Account
        </Link>
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
