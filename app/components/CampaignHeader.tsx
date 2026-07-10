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
  businessId: number;
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
  embedded?: boolean;
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
  businessId,
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
  embedded = false,
}: CampaignHeaderProps) {
  const campaignsHref = `/business/${businessId}/dashboard/campaigns`;
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
        businessId,
        campaignId,
        price: parsePrice(price) ?? price,
      },
    });
  }, [campaignId, funnelId, businessId, price]);

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
  const immersiveChrome = embedded;

  const tabButtons = TABS.map(({ id, label, icon: Icon }) => {
    const active = id === activeTabId;
    const immersiveTabActive =
      "bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] text-white shadow-[0_6px_16px_rgba(24,119,242,0.38),inset_0_1px_0_rgba(255,255,255,0.2)]";
    const immersiveTabIdle =
      "bg-transparent text-white/60 hover:bg-white/10 hover:text-white";
    const lightTabActive =
      "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.22)]";
    const lightTabIdle =
      "bg-white text-slate-500 ring-1 ring-[#e8edf5] hover:bg-[#e8f2ff] hover:text-[#1877f2] hover:ring-[#1877f2]/20";

    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => selectTab(id)}
        className={`relative flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 ${
          immersiveChrome
            ? "px-2.5 py-1 text-[0.7rem] sm:px-3 sm:text-[0.74rem]"
            : "gap-1.5 px-2.5 py-1 text-[0.72rem] sm:px-3 sm:py-1.5 sm:text-[0.75rem]"
        } ${
          active
            ? immersiveChrome
              ? immersiveTabActive
              : lightTabActive
            : immersiveChrome
              ? immersiveTabIdle
              : lightTabIdle
        }`}
      >
        {Icon ? (
          <Icon
            className="size-3 shrink-0 text-current"
            aria-hidden
            strokeWidth={2.25}
          />
        ) : null}
        {label}
      </button>
    );
  });

  return (
    <>
    <header
      className={
        embedded
          ? "shrink-0 border-b border-[#e8edf5] bg-white"
          : "shrink-0 border-b border-zinc-200 bg-white"
      }
    >
      {immersiveChrome ? (
        <div className="grid min-h-[2.75rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 sm:min-h-[3rem] sm:gap-3 sm:px-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <Link
              href={campaignsHref}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-[#f8fafc] text-[#07111f] outline-none transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
              aria-label="Back to campaigns"
            >
              <ArrowLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
            </Link>
            <div className="hidden min-w-0 max-w-[9rem] md:block lg:max-w-[11rem]">
              <p
                className="m-0 truncate text-[0.8rem] font-extrabold tracking-tight text-[#07111f] lg:text-[0.88rem]"
                title={campaignTitle}
              >
                {campaignTitle}
              </p>
              {offerPriceLine ? (
                <p className="m-0 truncate text-[0.65rem] font-medium text-slate-500">
                  {offerPriceLine}
                </p>
              ) : null}
            </div>
          </div>

          <nav
            className="min-w-0 max-w-full justify-self-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Campaign sections"
          >
            <div className="relative mx-auto flex w-max max-w-full items-center gap-1 overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-[#07111f] via-[#0a1628] to-[#0f1f3d] p-0.5 shadow-[0_10px_28px_rgba(7,17,31,0.35)] sm:gap-1.5 sm:p-1">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(24,119,242,0.28),transparent_55%)]"
                aria-hidden
              />
              <div className="relative flex items-center gap-1 sm:gap-1.5">
                {tabButtons}
              </div>
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 justify-self-end">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1877f2] px-2.5 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-[#166fe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:px-3"
            >
              <Link2 className="size-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
              <span className="hidden sm:inline">Tracking link</span>
            </button>
            <button
              type="button"
              onClick={() => setEditCampaignOpen(true)}
              disabled={campaignId == null || campaign == null}
              title="Edit campaign"
              aria-label="Edit campaign"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#07111f] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
            >
              <Pencil className="size-3.5" aria-hidden strokeWidth={2.25} />
            </button>
          </div>
        </div>
      ) : (
        <>
      <div
        className={`flex w-full flex-nowrap items-center justify-between gap-2 sm:gap-3 ${
          embedded ? "px-2.5 py-2 sm:px-3" : "px-4 py-3 sm:px-5 sm:py-4"
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <Link
            href={campaignsHref}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-[#f8fafc] text-[#07111f] outline-none transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="size-4" aria-hidden strokeWidth={2.25} />
          </Link>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-left text-[0.95rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.05rem]">
              {campaignTitle}
            </p>
            {offerPriceLine && campaign?.campaignName?.trim() ? (
              <p className="truncate text-left text-[0.72rem] font-medium text-slate-500 sm:text-[0.78rem]">
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
            className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-[#1877f2] px-2.5 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-[#166fe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 focus-visible:ring-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:gap-2 sm:px-3 sm:text-[0.78rem]"
          >
            <Link2 className="size-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
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
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#07111f] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
          >
            <Pencil className="size-3.5" aria-hidden strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <nav
        className={embedded ? "border-b border-[#e8edf5] bg-[#f8fafc]/50" : "border-t border-zinc-100"}
        aria-label="Campaign sections"
      >
        <div
          className={`flex w-full gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden ${
            embedded ? "px-2.5 sm:px-3" : "px-4 sm:px-5"
          }`}
        >
          {tabButtons}
        </div>
      </nav>
        </>
      )}
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
