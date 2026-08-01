"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { notifyFacebookOAuthAuthenticated } from "@/app/lib/facebook-oauth-popup";
import { formatMetaScopeTitle } from "@/app/lib/meta-ads-permissions";

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

function FacebookLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      className={className}
    >
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function FacebookConnectedInner() {
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const granted = useMemo(
    () => parseGrantedParam(searchParams.get("granted")),
    [searchParams],
  );

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

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#ccd0d5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[#e4e6eb] bg-[#1877F2] px-6 py-5 text-center text-white">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
            <FacebookLogoMark className="size-7" />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
            Connected with Facebook
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            Meta Ads Connected Successfully
          </h1>
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-[#65676b]">
            Facebook granted the permissions below. Next, choose which ad
            account Dealioo should use.
          </p>

          {granted.length > 0 ? (
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#65676b]">
                Granted permissions
              </p>
              <ul className="mt-2.5 divide-y divide-[#e4e6eb] overflow-hidden rounded-lg border border-[#e4e6eb] bg-[#f7f8fa]">
                {granted.map((scopeId) => (
                  <li
                    key={scopeId}
                    className="flex items-start gap-3 bg-white px-3.5 py-3"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877F2]">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#050505]">
                        {formatMetaScopeTitle(scopeId)}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#65676b]">
                        {scopeId}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            href={selectHref}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/50"
          >
            <FacebookLogoMark className="size-4" />
            Select Meta Ad Account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function FacebookConnectedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5]">
          <p className="text-sm text-[#65676b]">Loading…</p>
        </main>
      }
    >
      <FacebookConnectedInner />
    </Suspense>
  );
}
