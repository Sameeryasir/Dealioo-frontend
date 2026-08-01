"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import {
  getFacebookAdAccounts,
  type FacebookAdAccount,
} from "@/app/services/facebook/get-facebook-ad-accounts";
import { setFacebookAdAccount } from "@/app/services/facebook/set-facebook-ad-account";
import { notifyFacebookOAuthComplete } from "@/app/lib/facebook-oauth-popup";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";

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

function SelectAdAccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams) ?? null;

  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const campaignsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/campaigns`
      : "/dashboard";

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
    if (businessId != null && notifyFacebookOAuthComplete(businessId)) {
      return;
    }
    router.push(campaignsHref);
  };

  const handleSave = async () => {
    if (businessId == null || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await setFacebookAdAccount(businessId, selectedId);
      if (notifyFacebookOAuthComplete(businessId)) {
        return;
      }
      router.push(campaignsHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save ad account.");
      setSaving(false);
    }
  };

  if (businessId == null) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5] px-4">
        <p className="text-sm text-[#b32d2e]">
          Missing business. Go back and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#ccd0d5] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="border-b border-[#e4e6eb] bg-[#1877F2] px-6 py-5 text-center text-white">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-[#1877F2] shadow-sm">
            <FacebookLogoMark className="size-7" />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
            Facebook Ads
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            Choose your ad account
          </h1>
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-sm leading-relaxed text-[#65676b]">
            Pick the Meta ad account for this business. Campaign stats will only
            come from this account.
          </p>

          {loading ? (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#65676b]">
              <Loader2 className="size-4 animate-spin text-[#1877F2]" aria-hidden />
              Loading ad accounts…
            </p>
          ) : null}

          {!loading && accounts.length > 0 ? (
            <ul
              className="mt-5 max-h-64 space-y-2 overflow-y-auto"
              role="radiogroup"
              aria-label="Meta ad accounts"
            >
              {accounts.map((account) => {
                const selected = selectedId === account.id;
                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedId(account.id)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                        selected
                          ? "border-[#1877F2] bg-[#e7f3ff]"
                          : "border-[#ccd0d5] bg-white hover:bg-[#f7f8fa]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
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
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#050505]">
                          {account.name?.trim() || "Unnamed account"}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#65676b]">
                          {account.id}
                          {account.currency ? ` · ${account.currency}` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!loading && accounts.length === 0 ? (
            <p className="mt-6 text-center text-sm text-[#65676b]">
              No ad accounts found for this Facebook login.
            </p>
          ) : null}

          {error ? (
            <p
              className="mt-4 flex items-start gap-2 rounded-lg border border-[#fad2d2] bg-[#fff8f8] px-3 py-2.5 text-sm text-[#b32d2e]"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !selectedId || loading}
            className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1877F2] py-2.5 text-sm font-bold text-white transition hover:bg-[#166fe5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/50 disabled:cursor-not-allowed disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4]"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <FacebookLogoMark className="size-4" />
                Save ad account
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-3 block w-full cursor-pointer text-center text-sm font-semibold text-[#1877F2] hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SelectAdAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f0f2f5]">
          <p className="text-sm text-[#65676b]">Loading…</p>
        </main>
      }
    >
      <SelectAdAccountInner />
    </Suspense>
  );
}
