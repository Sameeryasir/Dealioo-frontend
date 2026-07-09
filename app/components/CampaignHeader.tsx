"use client";

import {
  ArrowLeft,
  Check,
  Circle,
  Copy,
  ExternalLink,
  Info,
  Link2,
  Megaphone,
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditCampaignModal } from "@/app/components/campaign/EditCampaignModal";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import {
  buildFunnelPublicPath,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";

function parsePrice(raw: number | string | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

export type CampaignHeaderProps = {
  restaurantId: number;
  campaignId?: number;
  funnelId?: number | null;
  offer?: string;
  price?: number | string;
  campaign?: Funnel | null;
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onGenerateTrackingLink?: () => void;
  onCampaignUpdated?: () => void | Promise<void>;
};

const TABS: { id: string; label: string; icon?: typeof Circle }[] = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "orders", label: "Orders" },
  { id: "funnel", label: "Funnel" },
  { id: "automations", label: "Automations" },
  { id: "metrics", label: "Metrics" },
  { id: "offers", label: "Offers" },
  { id: "creative", label: "Creative Strategy", icon: Circle },
  { id: "ads", label: "Ads" },
];

export default function CampaignHeader({
  restaurantId,
  campaignId,
  funnelId,
  offer,
  price,
  campaign,
  defaultTabId = "overview",
  activeTabId: activeTabIdProp,
  onTabChange,
  onGenerateTrackingLink,
  onCampaignUpdated,
}: CampaignHeaderProps) {
  const campaignsHref = `/restaurant/${restaurantId}/dashboard/campaigns`;
  const offerLine = offer?.trim() ?? "";
  const priceText = useMemo(() => {
    const n = parsePrice(price);
    return n != null ? formatPrice(n) : null;
  }, [price]);

  const offerPriceLine = useMemo(() => {
    const parts = [offerLine, priceText].filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(".");
  }, [offerLine, priceText]);

  const campaignTitle =
    campaign?.campaignName?.trim() || offerPriceLine || "Campaign";

  const [internalTabId, setInternalTabId] = useState(defaultTabId);
  const isControlled =
    activeTabIdProp !== undefined && onTabChange !== undefined;
  const activeTabId = isControlled ? activeTabIdProp : internalTabId;

  const selectTab = useCallback(
    (id: string) => {
      if (isControlled) onTabChange(id);
      else setInternalTabId(id);
    },
    [isControlled, onTabChange],
  );

  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [editCampaignOpen, setEditCampaignOpen] = useState(false);
  const [trackingOrigin, setTrackingOrigin] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const landingTrackingPath = useMemo(() => {
    const routeId = resolveFunnelRouteId(funnelId, campaignId);
    if (routeId == null) return "";
    return buildFunnelPublicPath({
      funnelId: routeId,
      step: "landing",
      query: {
        restaurantId,
        campaignId,
        price: parsePrice(price) ?? price,
      },
    });
  }, [campaignId, funnelId, restaurantId, price]);

  const landingTrackingUrl = useMemo(() => {
    if (!landingTrackingPath || !trackingOrigin) return "";
    return `${trackingOrigin}${landingTrackingPath}`;
  }, [landingTrackingPath, trackingOrigin]);

  useEffect(() => {
    if (!trackingDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrackingDialogOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [trackingDialogOpen]);

  const handleGenerate = useCallback(() => {
    onGenerateTrackingLink?.();
    if (typeof window !== "undefined") {
      setTrackingOrigin(window.location.origin);
    }
    setCopyDone(false);
    setTrackingDialogOpen(true);
  }, [onGenerateTrackingLink]);

  const handleCopyLandingUrl = useCallback(async () => {
    if (!landingTrackingUrl) return;
    try {
      await navigator.clipboard.writeText(landingTrackingUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }, [landingTrackingUrl]);

  const isFunnelTab = activeTabId === "funnel";

  return (
    <>
    <header className="shrink-0 border-b border-zinc-200 bg-white">
      <div className="flex w-full flex-nowrap items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5">
          <Link
            href={campaignsHref}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-700 outline-none ring-offset-2 ring-offset-white transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-600/40"
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="size-5" aria-hidden strokeWidth={2} />
          </Link>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-left text-sm font-medium text-zinc-900 sm:text-base">
              {campaignTitle}
            </p>
            {offerPriceLine && campaign?.campaignName?.trim() ? (
              <p className="truncate text-left text-xs text-zinc-500 sm:text-sm">
                {offerPriceLine}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={campaignId == null || !isFunnelTab}
            title={
              campaignId == null
                ? "Campaign details not loaded yet"
                : !isFunnelTab
                  ? "Open the Funnel tab to generate a tracking link"
                  : "Get link for Facebook ads"
            }
            className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-black px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-100 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Link2 className="size-4 shrink-0" aria-hidden strokeWidth={2} />
            <span className="truncate">Generate Tracking Link</span>
          </button>
          <button
            type="button"
            onClick={() => setEditCampaignOpen(true)}
            disabled={campaignId == null || campaign == null}
            title={
              campaignId == null || campaign == null
                ? "Campaign details not loaded yet"
                : "Edit campaign"
            }
            aria-label="Edit campaign"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-black text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-100"
          >
            <Pencil className="size-3.5" aria-hidden strokeWidth={2} />
          </button>
        </div>
      </div>

      <nav
        className="border-t border-zinc-100"
        aria-label="Campaign sections"
      >
        <div className="flex w-full gap-1 overflow-x-auto px-3 sm:gap-2 sm:px-4 lg:px-6">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === activeTabId;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(id)}
                className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400/50 sm:px-4 ${
                  active
                    ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {Icon ? (
                  <Icon
                    className="size-3.5 shrink-0 text-current"
                    aria-hidden
                    strokeWidth={2}
                  />
                ) : null}
                {label}
                {active ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-950 sm:inset-x-3" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </header>

    {trackingDialogOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
        role="presentation"
        onClick={() => setTrackingDialogOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-link-dialog-title"
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- Black header --- */}
          <div className="relative bg-black px-6 pb-6 pt-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  <Megaphone className="size-3" strokeWidth={2.5} aria-hidden />
                  Meta ads
                </span>
                <div className="mt-4 flex items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                    <Link2 className="size-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="tracking-link-dialog-title"
                      className="text-xl font-bold tracking-tight"
                    >
                      Tracking link
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">
                      Paste as the website destination in your Facebook / Meta
                      ad landing step.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setTrackingDialogOpen(false)}
                className="shrink-0 rounded-xl border border-white/15 p-2 text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>

          {/* --- White body --- */}
          <div className="bg-white px-6 py-6">
            {campaignId != null && landingTrackingUrl ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                    Campaign
                  </p>
                  <p className="mt-2 text-base font-semibold text-zinc-900">
                    {campaignTitle}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {funnelId != null && funnelId >= 1
                      ? "Funnel is ready — copy the link below for your ads."
                      : "Save your funnel first so this link points to your live pages."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="tracking-landing-url"
                    className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500"
                  >
                    <Link2 className="size-3.5" strokeWidth={2.5} aria-hidden />
                    Landing URL
                  </label>
                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm">
                    <div className="px-4 py-4">
                      <input
                        id="tracking-landing-url"
                        readOnly
                        value={landingTrackingUrl}
                        className="w-full cursor-text select-all border-0 bg-transparent font-mono text-[13px] leading-relaxed text-zinc-900 outline-none sm:text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-3 border-t border-zinc-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 text-[11px] leading-relaxed text-zinc-500">
                        Origin
                        <span className="mt-0.5 block break-all font-mono text-zinc-700">
                          {trackingOrigin || "—"}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCopyLandingUrl()}
                        className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition sm:w-auto ${
                          copyDone
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
                        }`}
                      >
                        {copyDone ? (
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        ) : (
                          <Copy className="size-4" strokeWidth={2} aria-hidden />
                        )}
                        {copyDone ? "Copied" : "Copy link"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-zinc-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <p className="text-xs leading-relaxed text-zinc-600">
                    Dev server on port{" "}
                    <span className="font-mono font-semibold text-zinc-900">
                      3002
                    </span>
                    . Uses your current browser origin — works with ngrok and
                    local testing.
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-700">
                This campaign is not ready yet, so a tracking link cannot be
                built.
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2.5 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTrackingDialogOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Done
              </button>
              {campaignId != null && landingTrackingUrl ? (
                <Link
                  href={landingTrackingPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  <ExternalLink className="size-4" strokeWidth={2.25} aria-hidden />
                  Open preview
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ) : null}

    <EditCampaignModal
      open={editCampaignOpen}
      campaign={campaign}
      onOpenChange={setEditCampaignOpen}
      onSaved={onCampaignUpdated}
    />
    </>
  );
}
