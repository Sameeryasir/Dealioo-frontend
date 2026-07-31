"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  getGoogleAdsCustomers,
  type GoogleAdsCustomer,
} from "@/app/services/google-ads/get-google-ads-customers";
import { setGoogleAdsCustomer } from "@/app/services/google-ads/set-google-ads-customer";
import { notifyGoogleOAuthComplete } from "@/app/lib/google-oauth-popup";
import { readBusinessIdFromSearchParams } from "@/app/lib/business-id-params";

function formatGoogleCustomerId(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return id;
}

function customerSubtitle(customer: GoogleAdsCustomer): string {
  const parts: string[] = [];
  if (customer.isManager) {
    parts.push("Manager");
  } else if (customer.managerCustomerId) {
    parts.push("Ads account");
  }
  parts.push(formatGoogleCustomerId(customer.id));
  if (customer.currency) {
    parts.push(customer.currency);
  }
  if (customer.status && customer.status !== "ENABLED") {
    parts.push(customer.status);
  }
  return parts.join(", ");
}

function SelectGoogleCustomerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = readBusinessIdFromSearchParams(searchParams) ?? null;
  const oauthError = searchParams.get("error")?.trim() || null;

  const [customers, setCustomers] = useState<GoogleAdsCustomer[]>([]);
  // OAuth failures redirect here with ?error= — do not start in a loading spinner.
  const [loading, setLoading] = useState(() => !oauthError);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => oauthError);

  const campaignsHref =
    businessId != null
      ? `/business/${businessId}/dashboard/campaigns`
      : "/dashboard";

  const loadCustomers = useCallback(async () => {
    if (businessId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getGoogleAdsCustomers(businessId);
      setCustomers(list);
      if (list.length === 1) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load Google Ads accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
      setLoading(false);
      return;
    }
    void loadCustomers();
  }, [loadCustomers, oauthError]);

  const handleSkip = () => {
    if (businessId != null && notifyGoogleOAuthComplete(businessId)) {
      return;
    }
    router.push(campaignsHref);
  };

  const handleSave = async () => {
    if (businessId == null || !selectedId) return;
    const selected = customers.find((customer) => customer.id === selectedId);
    setSaving(true);
    setError(null);
    try {
      await setGoogleAdsCustomer(
        businessId,
        selectedId,
        selected?.managerCustomerId,
      );
      if (notifyGoogleOAuthComplete(businessId)) {
        return;
      }
      router.push(campaignsHref);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save Google Ads account.",
      );
      setSaving(false);
    }
  };

  if (businessId == null) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-red-700">Missing business. Go back and try again.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-[#e8edf5] bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#4285F4] ring-1 ring-[#e8edf5]">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </span>
        <h1 className="mt-5 text-center text-xl font-semibold text-[#07111f]">
          Choose your Google Ads account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Pick the Google Ads customer account for this business. Campaign
          stats will only come from this account.
        </p>

        {error ? (
          <p
            className="mt-6 flex items-start gap-2 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {!error && loading ? (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-[#1877f2]" aria-hidden />
            Loading Google Ads accounts…
          </p>
        ) : null}

        {!error && !loading && customers.length > 0 ? (
          <ul className="mt-6 max-h-64 space-y-2 overflow-y-auto">
            {customers.map((customer) => {
              const selected = selectedId === customer.id;
              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-[#1877f2] bg-[#e8f2ff] ring-1 ring-[#1877f2]/40"
                        : "border-[#e8edf5] hover:border-[#1877f2]/35 hover:bg-[#f4f8ff]"
                    }`}
                  >
                    <p className="font-semibold text-[#07111f]">
                      {customer.name?.trim() || "Unnamed account"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {customerSubtitle(customer)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!error && !loading && customers.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            No Google Ads accounts found for this Google login.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !selectedId || loading}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#1877f2] py-3 text-sm font-semibold text-white transition hover:bg-[#166fe0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Google Ads account"}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-3 block w-full text-center text-sm font-semibold text-[#1877f2] underline underline-offset-2 hover:text-[#166fe0]"
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}

export default function SelectGoogleCustomerPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-white">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <SelectGoogleCustomerInner />
    </Suspense>
  );
}
