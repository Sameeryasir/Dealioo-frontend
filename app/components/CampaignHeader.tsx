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
            <div className="relative overflow-hidden px-6 pb-7 pt-6 text-white sm:px-7 sm:pb-8 sm:pt-7">
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-[#05070d] via-[#0a1628] to-[#0f1f3d]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 size-48 rounded-full bg-[#1877f2]/30 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-12 -left-6 size-44 rounded-full bg-[#e1306c]/22 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <Megaphone className="size-3" strokeWidth={2.5} aria-hidden />
                    Meta ads
                  </span>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1877f2] to-[#e1306c] text-white shadow-[0_12px_28px_rgba(24,119,242,0.35)]">
                      <span
                        aria-hidden
                        className="absolute inset-[1px] rounded-[0.9rem] bg-gradient-to-br from-[#0a1628]/40 to-[#07111f]/20"
                      />
                      <Link2
                        className="relative size-6"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id="tracking-link-dialog-title"
                        className="text-[1.35rem] font-extrabold tracking-tight text-white sm:text-[1.5rem]"
                      >
                        Tracking link
                      </h2>
                      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/65">
                        Paste this as the website destination in your Facebook /
                        Meta ad.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="relative shrink-0 rounded-xl p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>

            <div className="relative bg-gradient-to-b from-[#f7faff] via-white to-white px-6 py-6 sm:px-7 sm:py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(24,119,242,0.08),transparent)]"
              />

              {campaignId != null && landingTrackingUrl ? (
                <div className="relative space-y-5">
                  <div className="overflow-hidden rounded-2xl border border-[#e2eaf5] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                    <div className="flex items-start gap-3.5 border-b border-[#eef2f8] px-4 py-4 sm:px-5">
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8f2ff] to-[#fdf2f8] text-[#1877f2] ring-1 ring-[#1877f2]/15">
                        <Sparkles className="size-4" strokeWidth={2.25} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e1306c]">
                          Campaign
                        </p>
                        <p className="mt-1 truncate text-base font-bold tracking-tight text-[#07111f]">
                          {campaignTitle}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                          {funnelId != null && funnelId >= 1
                            ? "Funnel is live — copy the link below for your ads."
                            : "Save your funnel first so this link points to your live pages."}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-4 sm:px-5">
                      <label
                        htmlFor="tracking-landing-url"
                        className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
                      >
                        <Link2 className="size-3.5 text-[#1877f2]" strokeWidth={2.5} aria-hidden />
                        Landing URL
                      </label>
                      <div className="overflow-hidden rounded-xl border border-[#dbeafe] bg-gradient-to-br from-[#f8fbff] to-[#fff8fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                        <div className="px-4 py-3.5">
                          <input
                            id="tracking-landing-url"
                            readOnly
                            value={landingTrackingUrl}
                            className="w-full cursor-text select-all border-0 bg-transparent font-mono text-[12.5px] leading-relaxed text-[#07111f] outline-none sm:text-[13px]"
                          />
                        </div>
                        <div className="flex justify-center border-t border-[#e8edf5]/90 bg-white/80 px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => void handleCopyLandingUrl()}
                            className={`inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition active:scale-[0.98] sm:w-auto ${
                              copyDone
                                ? "bg-gradient-to-r from-[#34a853] to-[#2d9248] shadow-[0_10px_22px_rgba(52,168,83,0.28)]"
                                : "bg-gradient-to-r from-[#1877f2] via-[#166fe5] to-[#e1306c] shadow-[0_10px_22px_rgba(24,119,242,0.3)] hover:brightness-105"
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
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#f0f7ff] via-white to-[#fff5f9] px-4 py-3.5">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1877f2]/10 text-[#1877f2]">
                      <Megaphone className="size-3.5" strokeWidth={2.25} aria-hidden />
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">
                      In Meta Ads Manager, set this URL as the website destination
                      for your ad. Guests land on your funnel landing page.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="relative rounded-2xl border border-[#e8edf5] bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
                  This campaign is not ready yet, so a tracking link cannot be
                  built.
                </p>
              )}

              <div className="relative mt-6 flex flex-col-reverse gap-2.5 border-t border-[#eef2f8] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="rounded-xl border border-[#e8edf5] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
                >
                  Done
                </button>
                {campaignId != null && landingTrackingUrl ? (
                  <Link
                    href={landingTrackingPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1877f2] to-[#0f5ed7] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,119,242,0.32)] transition hover:brightness-105 active:scale-[0.98]"
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
