"use client";

import { getVisibleCampaignHeaderTabs } from "@/app/components/campaign/campaign-header-utils";
import { useFunnelEditorWarmup } from "@/app/hooks/use-funnel-editor-warmup";
import {
  campaignDashboardHref,
  type CampaignDashboardTabId,
} from "@/app/lib/campaign-dashboard-tab";
import type { BusinessMemberPermission } from "@/app/services/member/types";
import Link from "next/link";
import { useEffect, useRef } from "react";

type CampaignHeaderCan = (
  permission: BusinessMemberPermission | "google_ads",
) => boolean;

type CampaignHeaderTabsProps = {
  businessId: number;
  campaignId?: number;
  activeTabId: CampaignDashboardTabId;
  immersive: boolean;
  campaignsHref: string;
  isOwnerLike: boolean;
  can: CampaignHeaderCan;
  permissionList: string[] | null | undefined;
};

export function CampaignHeaderTabs({
  businessId,
  campaignId,
  activeTabId,
  immersive,
  campaignsHref,
  isOwnerLike,
  can,
  permissionList,
}: CampaignHeaderTabsProps) {
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Partial<Record<string, HTMLAnchorElement>>>({});
  const canOpenFunnel = isOwnerLike || can("funnels_edit");
  const funnelHref =
    campaignId != null
      ? campaignDashboardHref(businessId, campaignId, "funnel")
      : null;
  const warmFunnelEditor = useFunnelEditorWarmup(canOpenFunnel, funnelHref);

  const visibleTabs = getVisibleCampaignHeaderTabs({
    isOwnerLike,
    can,
    permissionList,
  });

  useEffect(() => {
    const activeButton = tabButtonRefs.current[activeTabId];
    if (!activeButton || !navRef.current) return;
    activeButton.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeTabId]);

  const tabs = visibleTabs.map(({ id, label }) => {
    const active = id === activeTabId;
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
        onMouseEnter={() => {
          if (id === "funnel") warmFunnelEditor();
        }}
        onFocus={() => {
          if (id === "funnel") warmFunnelEditor();
        }}
        className={`relative z-[1] flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap font-semibold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/40 ${
          immersive
            ? `rounded-none px-2 py-1.5 text-[0.7rem] sm:px-2.5 sm:py-2 sm:text-[0.75rem] md:px-3 md:text-[0.78rem] ${
                active
                  ? "border-b-2 border-[#1877f2] text-slate-900"
                  : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
              }`
            : `gap-1.5 rounded-md px-2.5 py-1 text-[0.72rem] sm:px-3 sm:py-1.5 sm:text-[0.75rem] ${
                active
                  ? "bg-[#1877f2] text-white shadow-sm"
                  : "bg-transparent text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-800"
              }`
        }`}
      >
        {label}
      </Link>
    );
  });

  if (immersive) {
    return (
      <div className="campaign-immersive-patti__nav-wrap">
        <nav
          ref={navRef}
          className="campaign-immersive-patti__nav"
          aria-label="Campaign sections"
        >
          <div className="campaign-immersive-patti__nav-track">{tabs}</div>
        </nav>
        <p className="campaign-immersive-patti__nav-hint">
          Swipe sideways for all sections
        </p>
      </div>
    );
  }

  return (
    <nav
      ref={navRef}
      className="border-t border-zinc-100"
      aria-label="Campaign sections"
    >
      <div className="flex w-full gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] sm:gap-1.5 sm:px-5 [&::-webkit-scrollbar]:hidden">
        {tabs}
      </div>
    </nav>
  );
}
