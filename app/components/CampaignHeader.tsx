"use client";

import { ArrowLeft, Check, Circle, Copy, Link2, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  /** Funnel record id from GET /funnel/campaign/:campaignId — used in public guest URLs. */
  funnelId?: number | null;
  offer?: string;
  price?: number | string;
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onGenerateTrackingLink?: () => void;
  onEdit?: () => void;
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
  defaultTabId = "overview",
  activeTabId: activeTabIdProp,
  onTabChange,
  onGenerateTrackingLink,
  onEdit,
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
  const [trackingOrigin, setTrackingOrigin] = useState("");
  const [copyDone, setCopyDone] = useState(false);

  const landingTrackingPath = useMemo(() => {
    const routeId = resolveFunnelRouteId(funnelId, campaignId);
    if (routeId == null) return "";
    return buildFunnelPublicPath({
      funnelId: routeId,
      step: "landing",
      query: { restaurantId, campaignId },
    });
  }, [campaignId, funnelId, restaurantId]);

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

  const handleEdit = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

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
            {offerPriceLine ? (
              <p className="truncate text-left text-sm font-medium text-zinc-900 sm:text-base">
                {offerPriceLine}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={campaignId == null}
            title={
              campaignId == null
                ? "Campaign id missing"
                : "Get link for Facebook ads"
            }
            className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-black px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-100 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Link2 className="size-4 shrink-0" aria-hidden strokeWidth={2} />
            <span className="truncate">Generate Tracking Link</span>
          </button>
          <button
            type="button"
            onClick={handleEdit}
            aria-label="Edit campaign"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:ring-offset-2"
          >
            <Pencil className="size-[1.125rem]" aria-hidden strokeWidth={2} />
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
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
        role="presentation"
        onClick={() => setTrackingDialogOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-link-dialog-title"
          className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="tracking-link-dialog-title"
                className="text-base font-semibold text-zinc-900"
              >
                Tracking link
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Use this URL as the website destination in Facebook / Meta ads
                (landing step).
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setTrackingDialogOpen(false)}
              className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          {campaignId != null && landingTrackingUrl ? (
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                <span>
                  Campaign ID:{" "}
                  <span className="font-mono font-semibold text-zinc-900">
                    {campaignId}
                  </span>
                </span>
                {funnelId != null && funnelId >= 1 ? (
                  <span>
                    Funnel ID:{" "}
                    <span className="font-mono font-semibold text-zinc-900">
                      {funnelId}
                    </span>
                  </span>
                ) : null}
              </div>
              <label
                htmlFor="tracking-landing-url"
                className="block text-xs font-medium text-zinc-500"
              >
                Landing URL
              </label>
              <div className="flex gap-2">
                <input
                  id="tracking-landing-url"
                  readOnly
                  value={landingTrackingUrl}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => void handleCopyLandingUrl()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                >
                  {copyDone ? (
                    <Check className="size-4 text-emerald-600" strokeWidth={2} />
                  ) : (
                    <Copy className="size-4" strokeWidth={2} />
                  )}
                  {copyDone ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[0.65rem] leading-relaxed text-zinc-500">
                Dev server runs on port{" "}
                <span className="font-mono text-zinc-700">3002</span> — link
                uses your current origin (
                <span className="font-mono">{trackingOrigin || "—"}</span>).
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800">
              This campaign has no id in the URL, so a tracking link cannot be
              built.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            {campaignId != null && landingTrackingUrl ? (
              <Link
                href={landingTrackingPath}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Open preview
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setTrackingDialogOpen(false)}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
