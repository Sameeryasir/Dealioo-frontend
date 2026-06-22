"use client";

import { AlertCircle, Loader2, Megaphone, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
  formatMetaCount,
  formatMetaDeliveryStatus,
  formatMetaSpend,
} from "@/app/lib/format-meta-ads";
import {
  getGoogleAdsCampaignStats,
  type GoogleAdsCampaignStats,
} from "@/app/services/google-ads/get-google-ads-campaign-stats";

type GoogleAdsCampaignsDialogProps = {
  open: boolean;
  onClose: () => void;
  restaurantId: number;
  customerId: string | null;
};

function statusClass(status: string | null | undefined): string {
  const normalized = status?.toUpperCase() ?? "";
  if (normalized === "ENABLED" || normalized === "ACTIVE") {
    return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
  }
  if (normalized === "PAUSED" || normalized.includes("PAUSED")) {
    return "bg-amber-500/15 text-amber-200 ring-amber-500/30";
  }
  return "bg-zinc-700 text-zinc-300 ring-zinc-600";
}

export function GoogleAdsCampaignsDialog({
  open,
  onClose,
  restaurantId,
  customerId,
}: GoogleAdsCampaignsDialogProps) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GoogleAdsCampaignStats | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGoogleAdsCampaignStats(restaurantId);
      setStats(data);
    } catch (e) {
      setStats(null);
      setError(
        e instanceof Error
          ? e.message
          : "Could not load Google Ads campaigns.",
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!open) return;
    void loadCampaigns();
  }, [open, loadCampaigns]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const campaigns = stats?.campaigns ?? [];
  const displayCustomerId = customerId ?? stats?.customerId ?? null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
      />

      <div className="relative flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 shrink-0 text-[#4285F4]" aria-hidden />
              <h2 id={titleId} className="text-base font-semibold text-white">
                Google Ads campaigns
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {stats?.customerName?.trim() || "Linked Google Ads account"}
              {displayCustomerId ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-mono text-zinc-500">
                    {displayCustomerId}
                  </span>
                </>
              ) : null}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Last 30 days from your linked account
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void loadCampaigns()}
              disabled={loading}
              aria-label="Refresh campaigns"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
                aria-hidden
              />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              <X className="size-4" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && !stats ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading campaigns…
            </p>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <p className="flex items-start gap-2 text-sm text-red-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadCampaigns()}
                disabled={loading}
                className="mt-3 cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/20 disabled:opacity-60"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !error && campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-800/40 px-4 py-10 text-center">
              <Megaphone className="mx-auto size-8 text-zinc-600" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-zinc-200">
                No campaigns found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Campaigns with activity in the last 30 days will show here.
              </p>
            </div>
          ) : null}

          {!error && campaigns.length > 0 ? (
            <ul className="space-y-3">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {campaign.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                        {campaign.id}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusClass(campaign.effectiveStatus ?? campaign.status)}`}
                    >
                      {formatMetaDeliveryStatus(
                        campaign.effectiveStatus ?? campaign.status,
                      )}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-zinc-900/80 px-2.5 py-2">
                      <dt className="text-zinc-500">Spend</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-100">
                        {formatMetaSpend(
                          campaign.insights?.spend,
                          stats?.currency,
                        )}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-zinc-900/80 px-2.5 py-2">
                      <dt className="text-zinc-500">Impressions</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-100">
                        {formatMetaCount(campaign.insights?.impressions)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-zinc-900/80 px-2.5 py-2">
                      <dt className="text-zinc-500">Clicks</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-100">
                        {formatMetaCount(campaign.insights?.clicks)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-zinc-900/80 px-2.5 py-2">
                      <dt className="text-zinc-500">Conversions</dt>
                      <dd className="mt-0.5 font-semibold text-zinc-100">
                        {formatMetaCount(campaign.insights?.conversions)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full cursor-pointer rounded-xl bg-white text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
