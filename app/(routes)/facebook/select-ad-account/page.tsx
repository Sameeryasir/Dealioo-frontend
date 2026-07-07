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

function SelectAdAccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantIdRaw = searchParams.get("restaurantId");
  const restaurantId =
    restaurantIdRaw && /^\d+$/.test(restaurantIdRaw)
      ? Number.parseInt(restaurantIdRaw, 10)
      : null;

  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const campaignsHref =
    restaurantId != null
      ? `/restaurant/${restaurantId}/dashboard/campaigns`
      : "/dashboard";

  const loadAccounts = useCallback(async () => {
    if (restaurantId == null) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getFacebookAdAccounts(restaurantId);
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
  }, [restaurantId]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleSkip = () => {
    if (restaurantId != null && notifyFacebookOAuthComplete(restaurantId)) {
      return;
    }
    router.push(campaignsHref);
  };

  const handleSave = async () => {
    if (restaurantId == null || !selectedId) return;
    setSaving(true);
    setError(null);
    try {
      await setFacebookAdAccount(restaurantId, selectedId);
      if (notifyFacebookOAuthComplete(restaurantId)) {
        return;
      }
      router.push(campaignsHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save ad account.");
      setSaving(false);
    }
  };

  if (restaurantId == null) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-red-700">Missing restaurant. Go back and try again.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#1877F2] text-white">
          <Check className="size-7" strokeWidth={2.5} aria-hidden />
        </span>
        <h1 className="mt-5 text-center text-xl font-semibold text-zinc-900">
          Choose your ad account
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Pick the Meta ad account for this restaurant. Campaign stats will only
          come from this account.
        </p>

        {loading ? (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading ad accounts…
          </p>
        ) : null}

        {!loading && accounts.length > 0 ? (
          <ul className="mt-6 max-h-64 space-y-2 overflow-y-auto">
            {accounts.map((account) => {
              const selected = selectedId === account.id;
              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(account.id)}
                    className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-[#1877F2] bg-[#1877F2]/5 ring-1 ring-[#1877F2]"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <p className="font-semibold text-zinc-900">
                      {account.name?.trim() || "Unnamed account"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {account.id}
                      {account.currency ? `, ${account.currency}` : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!loading && accounts.length === 0 ? (
          <p className="mt-6 text-center text-sm text-zinc-600">
            No ad accounts found for this Facebook login.
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-4 flex items-start gap-2 text-sm text-red-700"
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
          className="mt-6 w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save ad account"}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-3 block w-full text-center text-sm text-zinc-500 underline underline-offset-2"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}

export default function SelectAdAccountPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <p className="text-sm text-zinc-600">Loading…</p>
        </main>
      }
    >
      <SelectAdAccountInner />
    </Suspense>
  );
}
