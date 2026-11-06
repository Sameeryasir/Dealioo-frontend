"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import {
  getFacebookAdAccounts,
  type FacebookAdAccount,
} from "@/app/services/facebook/get-facebook-ad-accounts";
import { setFacebookAdAccount } from "@/app/services/facebook/set-facebook-ad-account";
import { notifyFacebookOAuthComplete } from "@/app/lib/facebook-oauth-popup";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { integrationsStatusQueryKey } from "@/app/services/integration-audit/get-integrations-status";

function accountStatusLabel(status: number | null): string {
  if (status == null || status === 1) return "Active";
  if (status === 2) return "Disabled";
  if (status === 3) return "Unsettled";
  if (status === 7) return "Pending review";
  if (status === 101) return "Closed";
  return "Unavailable";
}

function accountSubtitle(account: FacebookAdAccount): string {
  const parts: string[] = [accountStatusLabel(account.accountStatus)];
  const id = account.accountId?.trim() || account.id;
  if (id) parts.push(id);
  const currency = account.currency?.trim();
  if (currency) parts.push(currency);
  return parts.join(" • ");
}

function SelectAdAccountInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams) ?? null;

  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const integrationsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/settings/integrations`
      : "/dashboard";

  const metaCampaignBuilderHref =
    businessId != null
      ? `/business/${businessId}/dashboard/meta`
      : "/dashboard";

  const refreshIntegrationsStatus = useCallback(async () => {
    if (businessId == null) return;
    await queryClient.invalidateQueries({
      queryKey: integrationsStatusQueryKey(businessId),
    });
  }, [businessId, queryClient]);

  const loadAccounts = useCallback(async () => {
    if (businessId == null) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getFacebookAdAccounts(businessId);
      setAccounts(list);
      if (list.length === 1) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load ad accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleSkip = () => {
    void refreshIntegrationsStatus();
    if (
      businessId != null &&
      notifyFacebookOAuthComplete(businessId, integrationsHref)
    ) {
      return;
    }
    router.push(integrationsHref);
  };

  const handleSave = async () => {
    if (businessId == null || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await setFacebookAdAccount(businessId, selectedId);
      await refreshIntegrationsStatus();
      if (
        notifyFacebookOAuthComplete(businessId, metaCampaignBuilderHref)
      ) {
        return;
      }
      router.push(metaCampaignBuilderHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save ad account.");
      setSaving(false);
    }
  };

  if (businessId == null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f5f6f8] px-4">
        <p className="text-sm text-[#b32d2e]">
          Missing business. Go back and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f5f6f8] px-4 py-10">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)]">
        <div className="space-y-6 px-5 py-7 sm:px-7 sm:py-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center gap-2.5">
              <MetaLogo className="h-8 w-8" />
              <span className="text-[17px] font-semibold tracking-tight text-[#1c1e21]">
                Meta Ads
              </span>
            </div>
            <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[#1c1e21]">
              Choose your Meta ad account
            </h1>
            <p className="mx-auto mt-2 max-w-[22rem] text-[13px] leading-relaxed text-[#65676b]">
              Select the Meta ad account you want to connect with Dealioo.
              Campaign stats will come from the selected account.
            </p>
          </div>

          {error ? (
            <div className="space-y-3">
              <p
                className="flex items-start gap-2 rounded-xl bg-[#fff8f8] px-3 py-2.5 text-[13px] text-[#b32d2e]"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadAccounts()}
                disabled={loading}
                className="w-full cursor-pointer rounded-xl border border-[#dadde1] bg-white py-2.5 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f7f8fa] disabled:opacity-60"
              >
                {loading ? "Loading…" : "Try again"}
              </button>
            </div>
          ) : null}

          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-[#65676b]">
              <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
              Loading Meta ad accounts…
            </p>
          ) : null}

          {!loading && accounts.length > 0 ? (
            <ul
              className="m-0 max-h-[24rem] list-none space-y-3 overflow-y-auto p-0"
              role="radiogroup"
              aria-label="Meta ad accounts"
            >
              {accounts.map((account) => {
                const selected = selectedId === account.id;
                const title = account.name?.trim() || "Unnamed account";

                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedId(account.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-colors ${
                        selected
                          ? "border-[#1877F2] bg-[#e8f1ff]"
                          : "border-[#dadde1] bg-white hover:bg-[#f7f8fa]"
                      }`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-white text-[#1877F2] ring-1 ring-[#d6e6ff]"
                            : "bg-[#f0f2f5] text-[#65676b]"
                        }`}
                        aria-hidden
                      >
                        <Building2 className="size-5" strokeWidth={1.75} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold leading-snug text-[#1c1e21]">
                          {title}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] leading-snug text-[#65676b]">
                          {accountSubtitle(account)}
                        </span>
                      </span>

                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-[#1877F2]"
                            : "border-[#ccd0d5] bg-white"
                        }`}
                        aria-hidden
                      >
                        {selected ? (
                          <span className="size-2.5 rounded-full bg-[#1877F2]" />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!loading && accounts.length === 0 && !error ? (
            <p className="py-6 text-center text-sm text-[#65676b]">
              No ad accounts found for this Meta login.
            </p>
          ) : null}

          <div className="space-y-3.5 pt-1">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !selectedId || loading}
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#1877F2] text-[15px] font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 disabled:cursor-not-allowed disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4]"
            >
              {saving ? "Saving…" : "Save Meta ad account"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="flex w-full cursor-pointer items-center justify-center text-[14px] font-semibold text-[#1877F2] underline underline-offset-2 hover:text-[#166fe5]"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SelectAdAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f5f6f8]">
          <p className="text-sm text-[#65676b]">Loading…</p>
        </main>
      }
    >
      <SelectAdAccountInner />
    </Suspense>
  );
}
