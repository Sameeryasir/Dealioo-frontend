"use client";

import {
  ArrowLeft,
  Link2,
  PanelLeft,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSidebarExpand } from "@/app/contexts/sidebar-expand-context";
import { useBusinessMembershipPermissions } from "@/app/hooks/use-business-membership-permissions";
import { EditCampaignModal } from "@/app/components/campaign/EditCampaignModal";
import { FunnelTrackingLinkDialog } from "@/app/components/campaign/FunnelTrackingLinkDialog";
import type { Funnel } from "@/app/services/funnel/get-campaigns-by-business";
import {
  buildFunnelDesignPreviewPath,
  buildFunnelLandingTrackingUrl,
  resolveFunnelRouteId,
} from "@/app/lib/funnel-public-path";
import { automationEase } from "@/app/lib/motion";
import {
  CAMPAIGN_DASHBOARD_TABS,
  campaignDashboardHref,
  campaignDashboardTabFromPathname,
} from "@/app/lib/campaign-dashboard-tab";

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
  onGenerateTrackingLink?: () => void;
  onCampaignUpdated?: () => void | Promise<void>;
  embedded?: boolean;
};

export default function CampaignHeader({
  businessId,
  campaignId,
  funnelId,
  offer,
  price,
  campaign,
  onGenerateTrackingLink,
  onCampaignUpdated,
  embedded = false,
}: CampaignHeaderProps) {
  const pathname = usePathname();
  const { can } = useBusinessMembershipPermissions(businessId);
  const canEditCampaign = can("campaigns_edit");
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

  const activeTabId =
    campaignId != null
      ? campaignDashboardTabFromPathname(pathname, businessId, campaignId)
      : "overview";

  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [editCampaignOpen, setEditCampaignOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Partial<Record<string, HTMLAnchorElement>>>({});
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpand();

  const landingTrackingUrl = useMemo(() => {
    return buildFunnelLandingTrackingUrl({
      funnelId,
      campaignId,
      businessId,
      price: parsePrice(price) ?? price,
      campaignType:
        campaign?.campaignType === "prepaid" ||
        campaign?.campaignType === "postpaid"
          ? campaign.campaignType
          : undefined,
    });
  }, [campaignId, funnelId, businessId, price, campaign?.campaignType]);

  const landingPreviewUrl = useMemo(() => {
    const routeId = resolveFunnelRouteId(funnelId);
    if (routeId == null) return "";
    return buildFunnelDesignPreviewPath(routeId, "landing");
  }, [funnelId]);

  const handleGenerate = useCallback(() => {
    onGenerateTrackingLink?.();
    setCopyDone(false);
    setTrackingDialogOpen(true);
  }, [onGenerateTrackingLink]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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

  const tabButtons = CAMPAIGN_DASHBOARD_TABS.map(({ id, label }) => {
    const active = id === activeTabId;
    const immersiveTabActive =
      "border-b-2 border-[#1877f2] text-slate-900";
    const immersiveTabIdle =
      "border-b-2 border-transparent text-slate-500 hover:text-slate-800";
    const lightTabActive =
      "bg-[#1877f2] text-white shadow-sm";
    const lightTabIdle =
      "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800";
    const href =
      campaignId != null
        ? campaignDashboardHref(businessId, campaignId, id)
        : campaignsHref;

    return (
      <Link
        key={id}
        href={href}
        ref={(node) => {
          if (node) tabButtonRefs.current[id] = node;
          else delete tabButtonRefs.current[id];
        }}
        role="tab"
        aria-selected={active}
        className={`relative z-[1] flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 ${
          immersiveChrome
            ? `rounded-none px-2 py-1.5 text-[0.7rem] sm:px-2.5 sm:py-2 sm:text-[0.75rem] md:px-3 md:text-[0.78rem] ${
                active ? immersiveTabActive : immersiveTabIdle
              }`
            : `gap-1.5 rounded-md px-2.5 py-1 text-[0.72rem] sm:px-3 sm:py-1.5 sm:text-[0.75rem] ${
                active ? lightTabActive : `ring-1 ring-slate-200 ${lightTabIdle}`
              }`
        }`}
      >
        {label}
      </Link>
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
                disabled={
                  !canEditCampaign || campaignId == null || campaign == null
                }
                title={
                  !canEditCampaign
                    ? "You do not have permission to edit campaigns"
                    : "Edit campaign"
                }
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
            disabled={
              !canEditCampaign || campaignId == null || campaign == null
            }
            title={
              !canEditCampaign
                ? "You do not have permission to edit campaigns"
                : campaignId == null || campaign == null
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

    {portalReady
      ? createPortal(
          <AnimatePresence>
            {trackingDialogOpen ? (
              <motion.div
                key="tracking-link-dialog"
                className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-4"
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
            className="absolute inset-0 cursor-default bg-slate-900/25 backdrop-blur-[2px]"
          />

          {campaignId != null && landingTrackingUrl ? (
            <FunnelTrackingLinkDialog
              campaignTitle={campaignTitle}
              funnelLive={funnelId != null && funnelId >= 1}
              landingTrackingUrl={landingTrackingUrl}
              landingPreviewUrl={landingPreviewUrl}
              copyDone={copyDone}
              onClose={() => setTrackingDialogOpen(false)}
              onCopy={() => void handleCopyLandingUrl()}
            />
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="tracking-link-dialog-title"
              className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_50px_-16px_rgba(15,23,42,0.18)]"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.28, ease: automationEase }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ad tracking link
                </p>
                <h2
                  id="tracking-link-dialog-title"
                  className="mt-2 text-xl font-semibold text-slate-900"
                >
                  Tracking link unavailable
                </h2>
              </div>
              <div className="px-5 py-4 sm:px-6">
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-800">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />
                  <p>
                    This campaign is not ready yet, so a tracking link cannot be
                    built.
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setTrackingDialogOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null}

    <EditCampaignModal
      open={editCampaignOpen}
      campaign={campaign}
      onOpenChange={setEditCampaignOpen}
      onSaved={onCampaignUpdated}
    />
    </>
  );
}
