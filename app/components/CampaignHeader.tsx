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
  PanelLeft,
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
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
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpand();

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
      "border-b-2 border-[#1877f2] text-slate-900";
    const immersiveTabIdle =
      "border-b-2 border-transparent text-slate-500 hover:text-slate-800";
    const lightTabActive =
      "bg-[#1877f2] text-white shadow-sm";
    const lightTabIdle =
      "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800";

    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => selectTab(id)}
        className={`relative z-[1] flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 ${
          immersiveChrome
            ? `rounded-none px-2 py-1.5 text-[0.7rem] sm:px-2.5 sm:py-2 sm:text-[0.75rem] md:px-3 md:text-[0.78rem] ${
                active ? immersiveTabActive : immersiveTabIdle
              }`
            : `gap-1.5 rounded-md px-2.5 py-1 text-[0.72rem] sm:px-3 sm:py-1.5 sm:text-[0.75rem] ${
                active ? lightTabActive : `ring-1 ring-slate-200 ${lightTabIdle}`
              }`
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
          ? "campaign-immersive-patti__header shrink-0"
          : "shrink-0 border-b border-zinc-200 bg-white"
      }
    >
      {immersiveChrome ? (
        <div className="campaign-immersive-patti__inner">
          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--start gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 md:hidden"
                aria-expanded={sidebarExpanded}
                aria-controls="rd-sidebar-nav"
                aria-label={sidebarExpanded ? "Close menu" : "Open menu"}
              >
                <PanelLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
              </button>
              <Link
                href={campaignsHref}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1877f2]/30"
                aria-label="Back to campaigns"
              >
                <ArrowLeft className="size-3.5" aria-hidden strokeWidth={2.25} />
              </Link>
              <div className="campaign-immersive-patti__side-title min-w-0 flex-1 md:max-w-[14rem] md:flex-none">
                <p
                  className="m-0 truncate text-[0.78rem] font-extrabold tracking-tight text-[#07111f] md:text-[0.8rem] xl:text-[0.88rem]"
                  title={campaignTitle}
                >
                  {campaignTitle}
                </p>
                {offerPriceLine ? (
                  <p className="m-0 truncate text-[0.62rem] font-medium text-slate-500 md:text-[0.65rem]">
                    {offerPriceLine}
                  </p>
                ) : null}
              </div>
            </div>

          <nav
            className="campaign-immersive-patti__nav"
            aria-label="Campaign sections"
          >
            <div className="campaign-immersive-patti__nav-track">
              {tabButtons}
            </div>
          </nav>

          <div className="campaign-immersive-patti__side campaign-immersive-patti__side--end shrink-0 gap-1.5">
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
                className="inline-flex items-center gap-1.5 rounded-md bg-[#1877f2] px-2.5 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-[#166fe0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:px-3"
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
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#0a1628]/15 bg-white shadow-2xl shadow-[#07111f]/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden bg-gradient-to-b from-[#07111f] via-[#0a1628] to-[#0f1f3d] px-6 pb-6 pt-6 text-white">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(24,119,242,0.28)_0%,transparent_70%),radial-gradient(ellipse_120%_35%_at_50%_100%,rgba(244,114,182,0.16)_0%,transparent_70%)]"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  <Megaphone className="size-3" strokeWidth={2.5} aria-hidden />
                  Meta ads
                </span>
                <div className="mt-4 flex items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white ring-1 ring-white/10">
                    <Link2 className="size-5" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="tracking-link-dialog-title"
                      className="text-xl font-bold tracking-tight text-white"
                    >
                      Tracking link
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-white/62">
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
                className="relative shrink-0 rounded-lg p-2 text-white/70 transition hover:bg-white/8 hover:text-white"
              >
                <X className="size-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>

          <div className="bg-white px-6 py-6">
            {campaignId != null && landingTrackingUrl ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Campaign
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#07111f]">
                    {campaignTitle}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {funnelId != null && funnelId >= 1
                      ? "Funnel is ready — copy the link below for your ads."
                      : "Save your funnel first so this link points to your live pages."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="tracking-landing-url"
                    className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                  >
                    <Link2 className="size-3.5" strokeWidth={2.5} aria-hidden />
                    Landing URL
                  </label>
                  <div className="overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc]">
                    <div className="px-4 py-4">
                      <input
                        id="tracking-landing-url"
                        readOnly
                        value={landingTrackingUrl}
                        className="w-full cursor-text select-all border-0 bg-transparent font-mono text-[13px] leading-relaxed text-[#07111f] outline-none sm:text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-3 border-t border-[#e8edf5] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 text-[11px] leading-relaxed text-slate-500">
                        Origin
                        <span className="mt-0.5 block break-all font-mono text-slate-700">
                          {trackingOrigin || "—"}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCopyLandingUrl()}
                        className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[0.85rem] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition sm:w-auto ${
                          copyDone
                            ? "bg-gradient-to-br from-[#2b8fff] via-[#1877f2] to-[#1468e8] shadow-[0_8px_18px_rgba(24,119,242,0.32)]"
                            : "bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] shadow-[0_8px_18px_rgba(24,119,242,0.32)] hover:from-[#2b8fff] hover:via-[#1877f2] hover:to-[#1468e8]"
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

                <div className="flex gap-3 rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3.5">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-[#1877f2]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <p className="text-xs leading-relaxed text-slate-600">
                    Dev server on port{" "}
                    <span className="font-mono font-semibold text-[#07111f]">
                      3002
                    </span>
                    . Uses your current browser origin — works with ngrok and
                    local testing.
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-700">
                This campaign is not ready yet, so a tracking link cannot be
                built.
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2.5 border-t border-[#e8edf5] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTrackingDialogOpen(false)}
                className="rounded-[0.85rem] border border-[#e8edf5] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fafc] hover:text-[#07111f]"
              >
                Done
              </button>
              {campaignId != null && landingTrackingUrl ? (
                <Link
                  href={landingTrackingPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[0.85rem] bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,119,242,0.32)] transition hover:from-[#2b8fff] hover:via-[#1877f2] hover:to-[#1468e8]"
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
