"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { getSetupAccessToken } from "@/app/lib/auth-session";
import { formatMetaScopeTitle } from "@/app/lib/meta-ads-permissions";
import {
  getFacebookConnectionStatus,
  type MetaConnectionStatus,
} from "@/app/services/facebook/get-facebook-connection-status";

function ScopeList({
  title,
  scopes,
  emptyLabel,
  tone,
}: {
  title: string;
  scopes: string[];
  emptyLabel: string;
  tone: "requested" | "granted";
}) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {scopes.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {scopes.map((scopeId) => (
            <li
              key={scopeId}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
                tone === "granted"
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-zinc-200 bg-zinc-50"
              }`}
            >
              <CheckCircle2
                className={`mt-0.5 size-4 shrink-0 ${
                  tone === "granted" ? "text-emerald-600" : "text-zinc-400"
                }`}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatMetaScopeTitle(scopeId)}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                  {scopeId}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FacebookPermissionsSummaryInner() {
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams);
  const [status, setStatus] = useState<MetaConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId == null) {
      setLoading(false);
      setError("Missing business. Open this page from a Meta Ads connection.");
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getSetupAccessToken().trim();
        if (!token) {
          throw new Error("You're signed out. Sign in again to view permissions.");
        }
        const next = await getFacebookConnectionStatus(token, businessId);
        setStatus(next);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load permission summary.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId]);

  const selectHref =
    businessId != null
      ? `/facebook/select-ad-account?businessId=${businessId}`
      : "/dashboard";
  const settingsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/settings?section=integrations`
      : "/dashboard";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#1877f2]">
            <Shield className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="m-0 text-lg font-semibold text-zinc-900">
              Meta Ads Permissions Summary
            </h1>
            <p className="m-0 mt-0.5 text-xs text-zinc-500">
              For Meta App Review — requested vs granted scopes
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading permissions…
          </p>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : status ? (
          <div className="mt-6 space-y-6">
            <ScopeList
              title="Requested Permissions"
              scopes={status.requestedScopes ?? []}
              emptyLabel="No requested permissions recorded."
              tone="requested"
            />
            <ScopeList
              title="Granted Permissions"
              scopes={status.metaOauthScopes ?? []}
              emptyLabel="No permissions granted yet."
              tone="granted"
            />
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Connection Status
              </h2>
              <p
                className={`mt-2 text-sm font-semibold ${
                  status.connected ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {status.connected ? "Connected" : "Not connected"}
              </p>
              {status.status ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Lifecycle: {status.status}
                </p>
              ) : null}
              {(status.missingRequiredScopes ?? []).length > 0 ? (
                <p className="mt-2 text-xs text-red-600">
                  Missing: {(status.missingRequiredScopes ?? []).join(", ")}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          {status?.connected ? (
            <Link
              href={selectHref}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166fe5]"
            >
              Select Meta Ad Account
            </Link>
          ) : null}
          <Link
            href={settingsHref}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Back to Integrations
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function FacebookPermissionsSummaryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <FacebookPermissionsSummaryInner />
    </Suspense>
  );
}
