"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Check,
  ChevronRight,
  Loader2,
  Lock,
  Save,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";
import {
  getFacebookAdAccounts,
  type FacebookAdAccount,
} from "@/app/services/facebook/get-facebook-ad-accounts";
import { setFacebookAdAccount } from "@/app/services/facebook/set-facebook-ad-account";
import { notifyFacebookOAuthComplete } from "@/app/lib/facebook-oauth-popup";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";
import { integrationsStatusQueryKey } from "@/app/services/integration-audit/get-integrations-status";

const ACCOUNT_THEME = {
  Icon: Briefcase,
  iconWrap: "bg-[#e8f1ff]",
  iconColor: "text-[#1877F2]",
  currencyWrap: "bg-[#e8f1ff]",
  currencyText: "text-[#1877F2]",
} as const;

function isActiveAccountStatus(status: number | null): boolean {
  // Meta Marketing API: 1 = ACTIVE
  return status == null || status === 1;
}

function accountStatusLabel(status: number | null): string {
  if (status == null || status === 1) return "Active";
  if (status === 2) return "Disabled";
  if (status === 3) return "Unsettled";
  if (status === 7) return "Pending review";
  if (status === 101) return "Closed";
  return "Unavailable";
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
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)]">
        <div
          className="relative overflow-hidden px-6 pb-8 pt-9 text-center text-white"
          style={{
            background:
              "linear-gradient(160deg, #1a73e8 0%, #1877F2 45%, #0d65d9 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30"
            style={{
              background:
                "radial-gradient(120% 80% at 20% 120%, #0a4fb8 0%, transparent 55%), radial-gradient(100% 70% at 80% 130%, #063d91 0%, transparent 50%)",
            }}
            aria-hidden
          />
          <span className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#0081FB] shadow-sm">
            <MetaLogo className="size-8" monochrome />
          </span>
          <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
            Meta Ads
          </p>
          <h1 className="relative mt-1 text-[22px] font-bold tracking-tight">
            Choose your ad account
          </h1>
        </div>

        <div className="space-y-6 px-5 py-7 sm:px-7 sm:py-8">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-[#65676b]">
              <Loader2
                className="size-4 animate-spin text-[#1877F2]"
                aria-hidden
              />
              Fetching ads account…
            </p>
          ) : null}

          {!loading && accounts.length > 0 ? (
            <ul
              className="m-0 max-h-[24rem] list-none space-y-3.5 overflow-y-auto p-0"
              role="radiogroup"
              aria-label="Meta ad accounts"
            >
              {accounts.map((account) => {
                const selected = selectedId === account.id;
                const { Icon } = ACCOUNT_THEME;
                const active = isActiveAccountStatus(account.accountStatus);
                const currency = account.currency?.trim() || null;

                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedId(account.id)}
                      className={`flex w-full cursor-pointer items-start gap-3.5 rounded-xl border px-4 py-4 text-left transition-colors ${
                        selected
                          ? "border-[#1877F2] bg-[#f7fbff]"
                          : "border-[#dadde1] bg-white hover:bg-[#f7f8fa]"
                      }`}
                    >
                      <span
                        className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? "border-[#1877F2] bg-[#1877F2] text-white"
                            : "border-[#ccd0d5] bg-white"
                        }`}
                        aria-hidden
                      >
                        {selected ? (
                          <Check className="size-3" strokeWidth={3} />
                        ) : null}
                      </span>

                      <span
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${ACCOUNT_THEME.iconWrap}`}
                        aria-hidden
                      >
                        <Icon
                          className={`size-5 ${ACCOUNT_THEME.iconColor}`}
                          strokeWidth={2}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold leading-snug text-[#1c1e21]">
                              {account.name?.trim() || "Unnamed account"}
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-[#65676b]">
                              {account.id}
                              {currency ? ` · ${currency}` : ""}
                            </span>
                          </span>
                          {currency ? (
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${ACCOUNT_THEME.currencyWrap} ${ACCOUNT_THEME.currencyText}`}
                            >
                              {currency}
                            </span>
                          ) : null}
                        </span>

                        <span
                          className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            active
                              ? "bg-[#eaf8ef] text-[#15803d]"
                              : "bg-[#fef2f2] text-[#b91c1c]"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              active ? "bg-[#22c55e]" : "bg-[#ef4444]"
                            }`}
                            aria-hidden
                          />
                          {accountStatusLabel(account.accountStatus)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!loading && accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#65676b]">
              No ad accounts found for this Meta login.
            </p>
          ) : null}

          {error ? (
            <p
              className="m-0 flex items-start gap-2 rounded-xl bg-[#fff8f8] px-3 py-2.5 text-[13px] text-[#b32d2e]"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          <div className="space-y-3.5 pt-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !selectedId || loading}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-[15px] font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/40 disabled:cursor-not-allowed disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4]"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  Save ad account
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="flex w-full cursor-pointer items-center justify-center gap-1 text-[14px] font-semibold text-[#1877F2] hover:underline"
            >
              Skip for now
              <ChevronRight className="size-4" aria-hidden />
            </button>

            <p className="m-0 flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[#8a8d91]">
              <Lock className="size-3 shrink-0" aria-hidden />
              Your information is secure and only used to connect your Meta
              account.
            </p>
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
