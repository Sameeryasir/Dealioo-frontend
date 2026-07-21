"use client";

import {
  ArrowLeft,
  Check,
  Circle,
  Copy,
  ExternalLink,
  Sparkles,
  Link2,
  Megaphone,
  PanelLeft,
  Pencil,
  X,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import { EditCampaignModal } from "@/app/components/campaign/EditCampaignModal";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import {
  buildFunnelPublicPath,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";
import { automationEase } from "@/app/lib/motion";

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
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Partial<Record<string, HTMLButtonElement>>>({});
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

  const handleGenerate = useCallback(() => {
    onGenerateTrackingLink?.();
    if (typeof window !== "undefined") {
      setTrackingOrigin(window.location.origin);
    }
    setCopyDone(false);
    setTrackingDialogOpen(true);
  }, [onGenerateTrackingLink]);

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

  useEffect(() => {
    const activeButton = tabButtonRefs.current[activeTabId];
    if (!activeButton || !navRef.current) return;
    activeButton.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeTabId]);

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
        ref={(node) => {
          if (node) tabButtonRefs.current[id] = node;
          else delete tabButtonRefs.current[id];
        }}
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

          <div className="campaign-immersive-patti__nav-wrap">
            <nav
              ref={navRef}
              className="campaign-immersive-patti__nav"
              aria-label="Campaign sections"
            >
              <div className="campaign-immersive-patti__nav-track">
                {tabButtons}
              </div>
            </nav>
            <p className="campaign-immersive-patti__nav-hint">
              Swipe sideways for all sections
            </p>
          </div>

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

    <AnimatePresence>
      {trackingDialogOpen ? (
        <motion.div
          key="tracking-link-dialog"
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => setTrackingDialogOpen(false)}
            className="absolute inset-0 cursor-default bg-[#07111f]/55 backdrop-blur-[8px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tracking-link-dialog-title"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[1.35rem] border border-white/10 bg-white shadow-[0_28px_64px_rgba(7,17,31,0.35),0_0_0_1px_rgba(24,119,242,0.08)]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: automationEase }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#0d192e] px-5 py-3.5 text-white sm:px-6 sm:py-4">
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                    <Link2 className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="tracking-link-dialog-title"
                        className="text-base font-extrabold tracking-tight text-white sm:text-lg"
                      >
                        Tracking link
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/90">
                        <Megaphone className="size-2.5" strokeWidth={2.5} aria-hidden />
                        Meta ads
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs leading-snug text-white/80 sm:text-[13px]">
                      Paste this as the website destination in your Facebook /
                      Meta ad.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="relative shrink-0 rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>

            <div className="relative bg-white px-6 py-5 sm:px-7 sm:py-6">
              {campaignId != null && landingTrackingUrl ? (
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f472b6] text-white">
                      <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f472b6]">
                        Campaign
                      </p>
                      <p className="truncate text-[15px] font-bold tracking-tight text-[#07111f]">
                        {campaignTitle}
                      </p>
                    </div>
                    <p className="hidden shrink-0 text-xs text-slate-400 sm:block">
                      {funnelId != null && funnelId >= 1
                        ? "Funnel live"
                        : "Save funnel first"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="tracking-landing-url"
                      className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                    >
                      <Link2 className="size-3.5 text-[#1877f2]" strokeWidth={2.5} aria-hidden />
                      Landing URL
                    </label>
                    <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                      <div className="px-3.5 py-3">
                        <input
                          id="tracking-landing-url"
                          readOnly
                          value={landingTrackingUrl}
                          className="w-full cursor-text select-all border-0 bg-transparent font-mono text-[12.5px] leading-relaxed text-[#07111f] outline-none sm:text-[13px]"
                        />
                      </div>
                      <div className="border-t border-[#e2e8f0] bg-white px-3.5 py-3">
                        <button
                          type="button"
                          onClick={() => void handleCopyLandingUrl()}
                          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition active:scale-[0.98] sm:w-auto ${
                            copyDone
                              ? "bg-[#34a853] hover:bg-[#2d9348]"
                              : "bg-[#1877f2] hover:bg-[#166fe5]"
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

                  <div className="flex gap-3 border-l-[3px] border-[#f472b6] bg-[#f8fafc] py-3 pl-3.5 pr-3">
                    <p className="text-xs leading-relaxed text-slate-600">
                      In Meta Ads Manager, set this URL as the website destination
                      for your ad. Guests land on your funnel landing page.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3.5 text-sm text-slate-700">
                  This campaign is not ready yet, so a tracking link cannot be
                  built.
                </p>
              )}

              <div className="relative mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef2f8] pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="rounded-lg border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#1877f2]/40 hover:text-[#1877f2]"
                >
                  Done
                </button>
                {campaignId != null && landingTrackingUrl ? (
                  <Link
                    href={landingTrackingPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1877f2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#166fe5] active:scale-[0.98]"
                  >
                    <ExternalLink className="size-4" strokeWidth={2.25} aria-hidden />
                    Open preview
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>

    <EditCampaignModal
      open={editCampaignOpen}
      campaign={campaign}
      onOpenChange={setEditCampaignOpen}
      onSaved={onCampaignUpdated}
    />
    </>
  );
}
